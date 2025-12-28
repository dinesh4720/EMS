using System;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;

public class InputHelper {
    [DllImport("user32.dll")]
    static extern bool SetCursorPos(int X, int Y);

    [DllImport("user32.dll")]
    public static extern void mouse_event(int dwFlags, int dx, int dy, int cButtons, int dwExtraInfo);

    public const int MOUSEEVENTF_LEFTDOWN = 0x02;
    public const int MOUSEEVENTF_LEFTUP = 0x04;
    public const int MOUSEEVENTF_RIGHTDOWN = 0x08;
    public const int MOUSEEVENTF_RIGHTUP = 0x10;

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    static extern bool GetCursorPos(out POINT lpPoint);

    [StructLayout(LayoutKind.Sequential)]
    public struct POINT
    {
        public int X;
        public int Y;
    }

    public static void Main() {
        string line;
        while ((line = Console.ReadLine()) != null) {
            string[] parts = line.Split(' ');
            string cmd = parts[0].ToUpper();

            try {
                switch (cmd) {
                    case "GET_POS":
                        POINT lpPoint;
                        if (GetCursorPos(out lpPoint)) {
                            Console.WriteLine("POS " + lpPoint.X + " " + lpPoint.Y);
                        } else {
                            Console.WriteLine("ERR Failed to get cursor pos");
                        }
                        break;
                    case "DOUBLECLICK":
                        mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
                        mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
                        mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
                        mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
                        Console.WriteLine("OK");
                        break;
                    case "RIGHTCLICK":
                        mouse_event(MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0);
                        mouse_event(MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0);
                        Console.WriteLine("OK");
                        break;
                    case "MOVE":
                        int x = int.Parse(parts[1]);
                        int y = int.Parse(parts[2]);
                        SetCursorPos(x, y);
                        Console.WriteLine("OK");
                        break;
                    case "CLICK":
                        // 0 = Left, 1 = Right
                        int btn = parts.Length > 1 ? int.Parse(parts[1]) : 0;
                        if (btn == 0) {
                            mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
                            mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
                        } else {
                            mouse_event(MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0);
                            mouse_event(MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0);
                        }
                        Console.WriteLine("OK");
                        break;
                    case "DRAG":
                        int sx = int.Parse(parts[1]);
                        int sy = int.Parse(parts[2]);
                        int ex = int.Parse(parts[3]);
                        int ey = int.Parse(parts[4]);
                        SetCursorPos(sx, sy);
                        mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
                        Thread.Sleep(30);
                        SetCursorPos(ex, ey);
                        Thread.Sleep(30);
                        mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
                        Console.WriteLine("OK");
                        break;
                    case "TYPE":
                        string text = line.Substring(5);
                        SendKeys.SendWait(text);
                        Console.WriteLine("OK");
                        break;
                    case "EXIT":
                        return;
                    default:
                        Console.WriteLine("ERR Unknown command");
                        break;
                }
            } catch (Exception e) {
                Console.WriteLine("ERR " + e.Message);
            }
        }
    }
}
