#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import time
import re
import pandas as pd
from netmiko import ConnectHandler
import os
import getpass  # استيراد getpass

# ============================================
# Nodes Information
# ============================================
nodes = [
    {"name": "CA4-01", "ip": "10.18.4.27"},
    {"name": "CA4-02", "ip": "10.18.4.30"},
    {"name": "CA5-01", "ip": "10.21.2.9"},
    {"name": "CA5-02", "ip": "10.21.2.12"},
    {"name": "HQ-01", "ip": "10.30.2.26"},
    {"name": "HQ-02", "ip": "10.30.2.29"},
    {"name": "RMD-02", "ip": "10.28.3.32"},
    {"name": "RMD-01", "ip": "10.28.3.35"},
]

# ============================================
# SSH Credentials
# ============================================
username = input("Enter your username: ")
password = getpass.getpass("Enter your password: ")  # يبقى مخفي

# ============================================
# Regex pattern for parsing output lines
# ============================================
pattern = re.compile(
    r"^(?P<interface>\S+)\s+(?P<state1>\S+)\s+(?P<state2>\S+)\s+(?P<desc>.+LR-(?P<lrnum>\d+))",
    re.MULTILINE
)

# ============================================
# Function to extract MTX-B
# ============================================
def extract_mtx_b(description):
    first_part = description.split("\\")[0]
    for prefix in ["HQ", "CA4", "CA5", "RMD", "BNS", "MNS", "ALX", "MKT", "TNT"]:
        if prefix in first_part:
            return prefix
    return first_part

# ============================================
# Function to parse rate
# ============================================
def get_rate(interface):
    if interface.startswith("Hu"):
        return "100G"
    elif interface.startswith("Te"):
        return "10G"
    else:
        return "Unknown"

# ============================================
# Function to parse status
# ============================================
def get_status(state1, state2):
    return "up" if state1 == "up" and state2 == "up" else "down"

# ============================================
# Connect to each node and collect data
# ============================================
results = []

for node in nodes:
    print(f"Connecting to {node['name']} ({node['ip']}) ...")
    device = {
        "device_type": "cisco_xr",
        "ip": node["ip"],
        "username": username,
        "password": password,
    }

    try:
        net_connect = ConnectHandler(**device)
        output = net_connect.send_command("show int des | i LR")
        net_connect.disconnect()

        for match in pattern.finditer(output):
            interface = match.group("interface")
            state1 = match.group("state1")
            state2 = match.group("state2")
            desc = match.group("desc")
            lrnum = match.group("lrnum")

            mtx_b = extract_mtx_b(desc)
            rate = get_rate(interface)
            status = get_status(state1, state2)

            results.append({
                "MTX-A": node["name"],
                "MTX-B": mtx_b,
                "interface": interface,
                "rate": rate,
                "LR Number": int(lrnum),
                "status": status
            })

        print(f"Data collected from {node['name']} successfully.\n")

    except Exception as e:
        print(f"Failed to connect to {node['name']} ({node['ip']}): {e}\n")

    time.sleep(4)

# ============================================
# Create DataFrame
# ============================================
df = pd.DataFrame(results, columns=["MTX-A", "MTX-B", "interface", "rate", "LR Number", "status"])

# ============================================
# Write to Report.xlsx → LR_Database
# ============================================
output_file = "Report.xlsx"

if os.path.exists(output_file):
    with pd.ExcelWriter(output_file, engine="openpyxl", mode="a", if_sheet_exists="replace") as writer:
        df.to_excel(writer, sheet_name="LR_Database", index=False)
    print(f"\nDONE: Sheet 'LR_Database' updated in '{output_file}'\n")
else:
    with pd.ExcelWriter(output_file, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="LR_Database", index=False)
    print(f"\nDONE: File '{output_file}' created with sheet 'LR_Database'\n")
