Attribute VB_Name = "CPN_Module1"

Option Explicit

' Type to hold match data efficiently (Arrays are cleaner but User Defined Type is better in robust VBA, but Types can't be in collections easily).
' We will use a simple Array for each matchItem:
' 0=Interface, 1=Direction, 2=Start, 3=End, 4=LR, 5=Rate, 6=Flaps, 7=Status

' Main Macro
Sub Build_CPN_Summary()
    ' Performance Optimization: Turn off Screen Updating & Calculation
    On Error GoTo Cleanup
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    Application.EnableEvents = False

    Dim wb As Workbook
    Dim wsLogs As Worksheet, wsLR As Worksheet, wsSum As Worksheet
    Dim lastRowLogs As Long, lastRowLR As Long
    Dim i As Long
    Dim dictLR As Object
    Dim key As String
    Dim logData As Variant, lrData As Variant
    Dim arrResults() As Variant
    Dim resCount As Long
    Dim mtxA As String, mtxB As String, iface As String
    Dim flapStart As String, flapEnd As String, numFlaps As Long, status As String
    Dim lrNum As Variant, rate As String
    Dim dirStr As String
    Dim cleanA As String, cleanB As String
    
    ' Stats
    Dim countUp As Long, countDown As Long
    Dim latestEnd As Date, currentEnd As Date
    Dim dictSummary As Object
    Dim sumKey As String
    Dim rates As Variant
    Dim r As Variant
    Dim statusTypes As Variant
    Dim finalMsg As String
    Dim displayRate As String
    
    ' Tracking uniqueness
    Dim seenLRsTable As Object
    Dim allDownLRs As Object
    Dim finalUpLRs As Object
    Dim finalDownLRs As Object
    Dim allMatches As Collection
    Dim matchArr As Variant
    Dim rItem As Variant, sItem As Variant
    
    Set wb = ThisWorkbook
    
    ' 1. Check/Setup Sheets
    On Error Resume Next
    Set wsLogs = wb.Sheets("CPN_Logs")
    Set wsLR = wb.Sheets("LR_Database")
    Set wsSum = wb.Sheets("CPN_Summary")
    On Error GoTo 0
    
    If wsLogs Is Nothing Or wsLR Is Nothing Then
        MsgBox "Error: CPN_Logs or LR_Database sheet missing!", vbCritical
        GoTo Cleanup
    End If
    
    If wsSum Is Nothing Then
        Set wsSum = wb.Sheets.Add(After:=wb.Sheets(wb.Sheets.Count))
        wsSum.Name = "CPN_Summary"
    Else
        ' --- UNPROTECT SHEET TO ALLOW MACRO TO EDIT ---
        ' Assuming no password. If password exists, change to: wsSum.Unprotect "Password"
        On Error Resume Next
        wsSum.Unprotect
        On Error GoTo 0
        
        ' ROBUST CLEANUP
        Dim usedR As Long
        usedR = wsSum.UsedRange.Rows.Count
        If usedR < 2 Then usedR = 2
        ' Unmerge and Clear everything below row 1
        On Error Resume Next
        wsSum.Range("A2:Z" & usedR + 50).UnMerge
        wsSum.Range("A2:Z" & usedR + 50).Clear
        wsSum.Range("A2:Z" & usedR + 50).Interior.Pattern = xlNone
        wsSum.Range("A2:Z" & usedR + 50).Borders.LineStyle = xlNone
        wsSum.Range("A2:Z" & usedR + 50).FormatConditions.Delete
        On Error GoTo 0
    End If
    
    ' 2. Load Data
    lastRowLogs = wsLogs.Cells(wsLogs.Rows.Count, "A").End(xlUp).Row
    lastRowLR = wsLR.Cells(wsLR.Rows.Count, "A").End(xlUp).Row
    
    If lastRowLogs < 2 Then
        wsSum.Range("L2").Value = "No data in CPN_Logs"
        MsgBox "CPN_Logs is empty.", vbExclamation
        GoTo Cleanup
    End If
    
    logData = wsLogs.Range("A2:F" & lastRowLogs).Value
    If lastRowLR >= 2 Then
        lrData = wsLR.Range("A2:F" & lastRowLR).Value
    End If
    
    ' 3. Index LR Database
    Set dictLR = CreateObject("Scripting.Dictionary")
    dictLR.CompareMode = vbTextCompare
    
    If IsArray(lrData) Then
        For i = 1 To UBound(lrData, 1)
            mtxA = CStr(lrData(i, 1))
            iface = NormalizeInterface(CStr(lrData(i, 3)))
            key = Trim(mtxA) & "|" & iface
            
            If Not dictLR.Exists(key) Then
                Set dictLR(key) = New Collection
            End If
            dictLR(key).Add Array(lrData(i, 2), lrData(i, 4), lrData(i, 5))
        Next i
    End If
    
    ' 4. Process Logs
    Set allDownLRs = CreateObject("Scripting.Dictionary")
    Set allMatches = New Collection
    latestEnd = CDate(0)
    
    For i = 1 To UBound(logData, 1)
        mtxA = CStr(logData(i, 1))
        iface = CStr(logData(i, 2))
        key = Trim(mtxA) & "|" & NormalizeInterface(iface)
        
        If dictLR.Exists(key) Then
            Dim lrList As Collection
            Set lrList = dictLR(key)
            
            flapStart = CStr(logData(i, 3))
            flapEnd = CStr(logData(i, 4))
            numFlaps = CLng(logData(i, 5))
            status = CStr(logData(i, 6))
            
            On Error Resume Next
            currentEnd = CDate(flapEnd)
            If Err.Number = 0 Then
                If currentEnd > latestEnd Then latestEnd = currentEnd
            End If
            On Error GoTo 0
            
            For Each r In lrList
                mtxB = CStr(r(0))
                rate = CStr(r(1))
                lrNum = CStr(r(2))
                cleanA = GetShortName(mtxA)
                cleanB = GetShortName(mtxB)
                dirStr = cleanA & " <> " & cleanB
                
                If LCase(status) = "down" Then allDownLRs(lrNum) = 1
                
                Dim mArr(0 To 7) As Variant
                mArr(0) = iface
                mArr(1) = dirStr
                mArr(2) = flapStart
                mArr(3) = flapEnd
                mArr(4) = lrNum
                mArr(5) = rate
                mArr(6) = numFlaps
                mArr(7) = status
                
                allMatches.Add mArr
            Next r
        End If
    Next i
    
    ' 5. Exclusivity Logic
    Set dictSummary = CreateObject("Scripting.Dictionary")
    Set seenLRsTable = CreateObject("Scripting.Dictionary")
    Set finalUpLRs = CreateObject("Scripting.Dictionary")
    Set finalDownLRs = CreateObject("Scripting.Dictionary")
    ReDim arrResults(1 To 8, 1 To 1)
    resCount = 0
    
    For Each matchArr In allMatches
        lrNum = matchArr(4)
        status = matchArr(7)
        rate = matchArr(5)
        dirStr = matchArr(1)
        
        Dim isDown As Boolean
        isDown = allDownLRs.Exists(lrNum)
        Dim shouldAdd As Boolean
        shouldAdd = False
        
        If LCase(status) = "down" Then
            shouldAdd = True
            finalDownLRs(lrNum) = 1
        Else
            If Not isDown Then
                shouldAdd = True
                finalUpLRs(lrNum) = 1
            End If
        End If
        
        If shouldAdd Then
            ' Proper casing for dict keys
            Dim capStatus As String
            If LCase(status) = "up" Then capStatus = "Up" Else capStatus = "Down"
            sumKey = UCase(rate) & "|" & capStatus
            
            Dim sumObj As Object
            If Not dictSummary.Exists(sumKey) Then
                Set sumObj = CreateObject("Scripting.Dictionary")
                sumObj.Add "Directions", CreateObject("Scripting.Dictionary")
                sumObj.Add "LRs", CreateObject("Scripting.Dictionary")
                dictSummary.Add sumKey, sumObj
            Else
                Set sumObj = dictSummary(sumKey)
            End If
            sumObj("Directions")(dirStr) = 1
            sumObj("LRs")(lrNum) = 1
        End If
    Next matchArr
    
    ' Table Rows - Pass 1 (Down)
    For Each matchArr In allMatches
        lrNum = matchArr(4)
        status = matchArr(7)
        If LCase(status) = "down" Then
            If Not seenLRsTable.Exists(lrNum) Then
                seenLRsTable(lrNum) = 1
                Call AddToResults(resCount, arrResults, matchArr)
            End If
        End If
    Next matchArr
    ' Table Rows - Pass 2 (Rest)
    For Each matchArr In allMatches
        lrNum = matchArr(4)
        If Not seenLRsTable.Exists(lrNum) Then
            seenLRsTable(lrNum) = 1
             Call AddToResults(resCount, arrResults, matchArr)
        End If
    Next matchArr
    
    countUp = finalUpLRs.Count
    countDown = finalDownLRs.Count
    
    ' 6. Writing Output
    wsSum.Range("A2").Resize(1, 8).Value = Array("Interface", "Flapping Start", "Flapping End", "Direction", "LR Number", "Rate", "Number of Flaps", "Status")
    With wsSum.Range("A2:H2")
        .Font.Bold = True
        .Interior.Color = RGB(146, 208, 80)
        .HorizontalAlignment = xlCenter
        .VerticalAlignment = xlCenter
        .Borders.LineStyle = xlContinuous
    End With
    
    If resCount > 0 Then
        Dim outArr() As Variant
        ReDim outArr(1 To resCount, 1 To 8)
        Dim c As Long
        For i = 1 To resCount
            For c = 1 To 8
                outArr(i, c) = arrResults(c, i)
            Next c
        Next i
        
        Dim destRange As Range
        Set destRange = wsSum.Range("A3").Resize(resCount, 8)
        destRange.Value = outArr
        
        wsSum.Range("A2").CurrentRegion.Sort Key1:=wsSum.Range("B2"), Order1:=xlDescending, Header:=xlYes
        
        ' BULK formatting
        With destRange
            .Font.Bold = True
            .Interior.Color = RGB(204, 255, 204)
            .HorizontalAlignment = xlCenter
            .VerticalAlignment = xlCenter
            .Borders.LineStyle = xlContinuous
        End With
    
        Dim rCol As Variant, sCol As Variant
        rCol = wsSum.Range("F3").Resize(resCount, 1).Value
        sCol = wsSum.Range("H3").Resize(resCount, 1).Value
        
        For i = 1 To resCount
            rate = UCase(CStr(rCol(i, 1)))
            status = UCase(CStr(sCol(i, 1)))
            
            If InStr(rate, "100G") > 0 Or InStr(rate, "HUNDRED") > 0 Then
                wsSum.Cells(i + 2, 6).Interior.Color = vbRed
            End If
            If status = "DOWN" Then
                wsSum.Cells(i + 2, 8).Interior.Color = vbRed
            ElseIf status = "UP" Then
                wsSum.Cells(i + 2, 8).Interior.Color = vbGreen
            End If
        Next i
        
        wsSum.Range("J2").Value = "Number of Flapped LRs"
        wsSum.Range("K2").Value = countUp
        wsSum.Range("J3").Value = "Number of Down LRs"
        wsSum.Range("K3").Value = countDown
        
        With wsSum.Range("J2:K3")
            .Font.Bold = True
            .Interior.Color = RGB(204, 255, 204)
            .Borders.LineStyle = xlContinuous
            .HorizontalAlignment = xlCenter
            .VerticalAlignment = xlCenter
        End With
        
        ' Fixed Column Widths as per CPN_Flapping.xlsx
        wsSum.Columns("A").ColumnWidth = 23.86
        wsSum.Columns("B").ColumnWidth = 21.71
        wsSum.Columns("C").ColumnWidth = 21.43
        wsSum.Columns("D").ColumnWidth = 17.14
        wsSum.Columns("E").ColumnWidth = 11
        wsSum.Columns("F").ColumnWidth = 5.86
        wsSum.Columns("G").ColumnWidth = 14.43
        wsSum.Columns("H").ColumnWidth = 6.71
        
    Else
        wsSum.Range("L2").Value = "No matches found"
        MsgBox "No matches found.", vbInformation
        GoTo Cleanup
    End If
    
    ' 7. Generate Message
    finalMsg = ""
    statusTypes = Array("Up", "Down")
    rates = Array("100G", "10G")
    
    For Each rItem In rates
        displayRate = CStr(rItem)
        For Each sItem In statusTypes
            sumKey = UCase(displayRate) & "|" & sItem
            If dictSummary.Exists(sumKey) Then
                If sItem = "Up" Then
                    finalMsg = finalMsg & "CPN flapped " & displayRate & vbCrLf
                Else
                    finalMsg = finalMsg & "CPN Down " & displayRate & vbCrLf
                End If
                
                Dim dDict As Object
                Set dDict = dictSummary(sumKey)("Directions")
                Dim rawDirs() As Variant
                rawDirs = dDict.Keys
                ' USE OPTIMIZED AGGREGATE
                Dim aggGroups As Collection
                Set aggGroups = AggregateDirections_Optimized(rawDirs)
                Dim groupObj As Variant
                For Each groupObj In aggGroups
                    finalMsg = finalMsg & CStr(groupObj) & vbCrLf
                Next groupObj
                
                finalMsg = finalMsg & vbCrLf & "LR:" & vbCrLf
                Dim lDict As Object
                Set lDict = dictSummary(sumKey)("LRs")
                If lDict.Count > 0 Then
                    Dim lrArr() As Variant
                    lrArr = lDict.Keys
                    Call SortArray(lrArr)
                    finalMsg = finalMsg & Join(lrArr, " , ") & vbCrLf & vbCrLf & vbCrLf
                Else
                    finalMsg = finalMsg & "None" & vbCrLf & vbCrLf & vbCrLf
                End If
            End If
        Next sItem
    Next rItem
    
    finalMsg = finalMsg & "Alarm time: " & Format(latestEnd, "mm/dd/yyyy hh:mm:ss AM/PM") & vbCrLf
    If countUp > 0 Then finalMsg = finalMsg & "Number of Flapped LRs: " & countUp & vbCrLf
    If countDown > 0 Then finalMsg = finalMsg & "Number of Down LRs: " & countDown & vbCrLf
    finalMsg = finalMsg & "KAM TT:" & vbCrLf & "Remedy TT:"
    
    ' --- NEW EXACT HEIGHT CALCULATION ---
    ' Use a temporary column to measure wrapped height
    Dim helperRow As Long
    helperRow = 15000 ' very far down
    
    ' Ensure Helper Column Z has same width as L
    wsSum.Columns("Z").ColumnWidth = wsSum.Columns("L").ColumnWidth
    
    With wsSum.Cells(helperRow, "Z")
        .Value = finalMsg
        .Font.Name = "Calibri" ' Ensure matches
        .Font.Size = 11
        .Font.Bold = True
        .WrapText = True
    End With
    
    wsSum.Rows(helperRow).AutoFit
    Dim reqHeight As Double
    reqHeight = wsSum.Rows(helperRow).RowHeight
    
    ' Cleanup helper
    wsSum.Cells(helperRow, "Z").Clear
    
    Dim stdHeight As Double
    stdHeight = wsSum.Rows(3).RowHeight
    If stdHeight = 0 Then stdHeight = 15
    
    Dim rowsNeeded As Long
    rowsNeeded = Application.WorksheetFunction.RoundUp(reqHeight / stdHeight, 0)
    
    Dim mergeEndRow As Long
    mergeEndRow = 2 + rowsNeeded - 1
    If mergeEndRow < 2 Then mergeEndRow = 2
    
    Dim msgRange As Range
    Set msgRange = wsSum.Range("L2:L" & mergeEndRow)
    
    With msgRange
        .Merge
        .Value = finalMsg
        .VerticalAlignment = xlTop
        .HorizontalAlignment = xlCenter
        .WrapText = True
        .Interior.Color = RGB(237, 125, 49)
        .Font.Bold = True
        .Borders(xlEdgeLeft).LineStyle = xlContinuous
        .Borders(xlEdgeTop).LineStyle = xlContinuous
        .Borders(xlEdgeBottom).LineStyle = xlContinuous
        .Borders(xlEdgeRight).LineStyle = xlContinuous
        .Borders(xlInsideHorizontal).LineStyle = xlNone
    End With
    
    ' --- PROTECT SHEET ---
    ' Lock A1 explicitly
    On Error Resume Next
    wsSum.Range("A1").Locked = True
    
    ' We assume A2 downwards can be unlocked or locked?
    ' Default Excel is ALL cells Locked.
    ' If we want user to edit data, we should Unlock A2:Z...
    ' But user didn't ask to unlock them, just wanted A1 Locked.
    ' If user wants to run macro again, we Unprotect at start.
    
    wsSum.Protect DrawingObjects:=True, Contents:=True, Scenarios:=True
    On Error GoTo 0
    
    MsgBox "CPN_Summary created!", vbInformation

Cleanup:
    ' Should re-protect if error occurred? yes
    On Error Resume Next
    If Not wsSum Is Nothing Then wsSum.Protect
    On Error GoTo 0
    
    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic
    Application.EnableEvents = True
    If Err.Number <> 0 Then
        MsgBox "Error: " & Err.Description, vbCritical
    End If
End Sub

Sub AddToResults(ByRef c As Long, ByRef arr As Variant, matchArr As Variant)
    c = c + 1
    ReDim Preserve arr(1 To 8, 1 To c)
    arr(1, c) = matchArr(0) ' Interface
    arr(2, c) = matchArr(2) ' Flapping Start (Moved to 2)
    arr(3, c) = matchArr(3) ' Flapping End   (Moved to 3)
    arr(4, c) = matchArr(1) ' Direction      (Moved to 4)
    arr(5, c) = CLng(matchArr(4)) ' LR Number
    arr(6, c) = matchArr(5) ' Rate
    arr(7, c) = matchArr(6) ' Number of Flaps
    arr(8, c) = matchArr(7) ' Status
End Sub

Function GetShortName(rawName As String) As String
    Dim temp As String
    temp = rawName
    temp = Replace(temp, ".", "-")
    temp = Split(temp, "-")(0)
    GetShortName = UCase(temp)
End Function

Function NormalizeInterface(rawName As String) As String
    Dim s As String
    s = UCase(Trim(rawName))
    s = Replace(s, "HUNDREDGIGE", "HU")
    s = Replace(s, "TENGIGE", "TE")
    s = Replace(s, "GIGE", "GI")
    s = Replace(s, "GIGABITETHERNET", "GI")
    s = Replace(s, "BUNDLE-ETHER", "BE")
    s = Replace(s, " ", "")
    NormalizeInterface = s
End Function

' Optimized Aggregation using Max Degree Heuristic
Function AggregateDirections_Optimized(rawDirs As Variant) As Collection
    Dim d As Variant
    Dim parts As Variant
    Dim adjList As Object
    Set adjList = CreateObject("Scripting.Dictionary")
    
    ' Build Graph: Node -> Dictionary(Neighbors)
    Dim i As Long
    For Each d In rawDirs
        parts = Split(d, "<>")
        If UBound(parts) = 1 Then
            Dim n1 As String, n2 As String
            n1 = Trim(parts(0)): n2 = Trim(parts(1))
            If Not adjList.Exists(n1) Then Set adjList(n1) = CreateObject("Scripting.Dictionary")
            If Not adjList.Exists(n2) Then Set adjList(n2) = CreateObject("Scripting.Dictionary")
            adjList(n1)(n2) = 1
            adjList(n2)(n1) = 1
        End If
    Next d
    
    Dim groups As New Collection
    Dim maxDegree As Long
    Dim bestNode As String
    Dim node As Variant, neighbor As Variant
    Dim safety As Long
    safety = 0
    
    Do While adjList.Count > 0
        safety = safety + 1
        If safety > 5000 Then Exit Do
        
        ' Find Node with Max Degree
        maxDegree = -1
        bestNode = ""
        For Each node In adjList.Keys
            If adjList(node).Count > maxDegree Then
                maxDegree = adjList(node).Count
                bestNode = node
            End If
        Next node
        
        If bestNode = "" Then Exit Do
        
        ' Collect Neighbors
        Dim neighborList As Object
        Set neighborList = adjList(bestNode)
        
        If neighborList.Count >= 0 Then
            Dim nArr() As Variant
            nArr = neighborList.Keys
            Call SortArray(nArr)
            groups.Add bestNode & " <> " & Join(nArr, " , ")
            
            ' Remove Edges
            For Each neighbor In neighborList.Keys
                ' Remove link back to bestNode
                If adjList.Exists(neighbor) Then
                    If adjList(neighbor).Exists(bestNode) Then
                        adjList(neighbor).Remove bestNode
                    End If
                    ' If neighbor isolated, remove node? No, only if we processed all its edges?
                    ' Here we processed the edge (bestNode, neighbor).
                    ' Does neighbor have other edges?
                    If adjList(neighbor).Count = 0 Then
                        adjList.Remove neighbor
                    End If
                End If
            Next neighbor
            
            ' Remove BestNode
            adjList.Remove bestNode
        End If
    Loop
    
    Set AggregateDirections_Optimized = groups
End Function

Sub SortArray(ByRef arr As Variant)
    Dim i As Long, j As Long
    Dim temp As Variant
    For i = LBound(arr) To UBound(arr) - 1
        For j = i + 1 To UBound(arr)
            Dim valI As Variant, valJ As Variant
            valI = arr(i)
            valJ = arr(j)
            If IsNumeric(valI) And IsNumeric(valJ) Then
                If CDbl(valI) > CDbl(valJ) Then
                    temp = arr(i)
                    arr(i) = arr(j)
                    arr(j) = temp
                End If
            Else
                If valI > valJ Then
                    temp = arr(i)
                    arr(i) = arr(j)
                    arr(j) = temp
                End If
            End If
        Next j
    Next i
End Sub
