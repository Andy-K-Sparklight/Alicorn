Set o = GetObject("winmgmts:" & "{impersonationLevel=impersonate}!\\" & "." & "\root\cimv2")
Set l1 = o.ExecQuery ("Select * from Win32_Process Where Name='javaw.exe'")
For Each op1 in l1
If op1.Priority<>13 Then op1.SetPriority(256)
Next
Set l2 = o.ExecQuery ("Select * from Win32_Process Where Name='java.exe'")
For Each op2 in l2
If op2.Priority<>13 Then op2.SetPriority(256)
Next
