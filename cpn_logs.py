#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import getpass
from netmiko import ConnectHandler
from datetime import datetime
import pandas as pd
import time
import sys
import re
import os

# -----------------------
# Edit nodes here if needed
# -----------------------
nodes = [
    {"name": "CA4-01", "ip": "10.18.4.27"},
    {"name": "CA4-02", "ip": "10.18.4.30"},
    {"name": "CA5-01", "ip": "10.21.2.9"},
    {"name": "CA5-02", "ip": "10.21.2.12"},
    {"name": "HQ-01", "ip": "10.30.2.26"},
    {"name": "HQ-02", "ip": "10.30.2.29"},
    {"name": "RMD-01", "ip": "10.28.3.35"},
    {"name": "RMD-02", "ip": "10.28.3.32"},
]

def build_command(start_dt: datetime, end_dt: datetime) -> str:
    start_str = start_dt.strftime("%Y %b %d %H:%M:%S")
    end_str = end_dt.strftime("%Y %b %d %H:%M:%S")
    return f"show logging start {start_str} end {end_str} | i isis"

def parse_logs(node_name, logs, year):
    """
    Parse raw logs and return structured data for Excel.
    """
    entries = {}
    for line in logs.splitlines():
        if "ADJCHANGE" not in line:
            continue

        # Extract timestamp using regex
        match = re.search(r'(\w{3} \d{1,2} \d{2}:\d{2}:\d{2})', line)
        if not match:
            continue
        timestamp = match.group(1)  # e.g. "Dec 11 15:30:57"

        # Extract interface
        intf_match = re.search(r'\((.*?)\)', line)
        if not intf_match:
            continue
        intf = intf_match.group(1).strip()

        # Extract status (Down if last part contains Down, else Up)
        status = "Down" if "Down" in line.split(",")[-1] else "Up"

        key = (node_name, intf)
        if key not in entries:
            entries[key] = {
                "MTX-A": node_name,
                "Interface": intf,
                "Flapping Start": timestamp,
                "Flapping End": timestamp,
                "count": 1,
                "Status": status
            }
        else:
            entries[key]["Flapping End"] = timestamp
            entries[key]["count"] += 1
            entries[key]["Status"] = status

    # Convert counts to Number of Flaps (divide by 2, ceil)
    for k, v in entries.items():
        v["Number of Flaps"] = (v["count"] + 1) // 2
        del v["count"]

    # Sort entries by Flapping Start time (with year)
    sorted_entries = sorted(
        entries.values(),
        key=lambda x: datetime.strptime(f"{year} {x['Flapping Start']}", "%Y %b %d %H:%M:%S")
    )

    return sorted_entries

def main():
    print("\nUnified CPN Log Collector → Report.xlsx → CPN_Logs\n")

    username = input("Username: ").strip()
    password = getpass.getpass("Password: ")

    # date input
    date_in = input("Date (YYYY-MM-DD): ").strip()
    try:
        day = datetime.strptime(date_in, "%Y-%m-%d")
    except:
        print("Invalid date format.")
        sys.exit(1)

    st_time = input("Start time (HH:MM:SS) [default 00:00:00]: ").strip() or "00:00:00"
    en_time = input("End time   (HH:MM:SS) [default 23:59:59]: ").strip() or "23:59:59"

    try:
        start_dt = datetime.strptime(f"{date_in} {st_time}", "%Y-%m-%d %H:%M:%S")
        end_dt = datetime.strptime(f"{date_in} {en_time}", "%Y-%m-%d %H:%M:%S")
    except:
        print("Invalid time format.")
        sys.exit(1)

    all_data = []

    for node in nodes:
        host = node["ip"]
        name = node["name"]

        try:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Connecting to {name} ({host})...")

            device = {
                "device_type": "cisco_xr",
                "host": host,
                "username": username,
                "password": password,
            }

            conn = ConnectHandler(**device)
            cmd = build_command(start_dt, end_dt)
            output = conn.send_command(cmd, delay_factor=1, max_loops=500)
            conn.disconnect()

            node_data = parse_logs(name, output, day.year)
            all_data.extend(node_data)

            print(f"[{datetime.now().strftime('%H:%M:%S')}] Logs processed for {name}.")

        except Exception as e:
            print(f"\nERROR connecting to {name} ({host}): {e}\n")

        time.sleep(1)

    if not all_data:
        print("No log entries found for the given date/time range.")
        sys.exit(0)

    # Create DataFrame
    df = pd.DataFrame(all_data, columns=[
        "MTX-A", "Interface", "Flapping Start", "Flapping End", "Number of Flaps", "Status"
    ])

    # Check if 'Report.xlsx' exists
    output_file = "Report.xlsx"
    if os.path.exists(output_file):
        # Load existing file
        with pd.ExcelWriter(output_file, engine="openpyxl", mode="a", if_sheet_exists="replace") as writer:
            df.to_excel(writer, sheet_name="CPN_Logs", index=False)
        print(f"\nDONE: Sheet 'CPN_Logs' updated in '{output_file}'\n")
    else:
        # Create new file with required sheet
        with pd.ExcelWriter(output_file, engine="openpyxl") as writer:
            df.to_excel(writer, sheet_name="CPN_Logs", index=False)
        print(f"\nDONE: File '{output_file}' created with sheet 'CPN_Logs'\n")

if __name__ == "__main__":
    main()
