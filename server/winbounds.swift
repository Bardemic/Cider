import CoreGraphics
import Foundation

let opts = CGWindowListOption.optionOnScreenOnly
guard let wins = CGWindowListCopyWindowInfo(opts, kCGNullWindowID) as? [[String: Any]] else { exit(1) }

for w in wins {
    guard let owner = w["kCGWindowOwnerName"] as? String, owner == "Simulator" else { continue }
    guard let layer = w["kCGWindowLayer"] as? Int, layer == 0 else { continue }
    guard let b = w["kCGWindowBounds"] as? [String: Any] else { continue }
    let x = Int((b["X"] as? Double) ?? 0)
    let y = Int((b["Y"] as? Double) ?? 0)
    let ww = Int((b["Width"] as? Double) ?? 0)
    let hh = Int((b["Height"] as? Double) ?? 0)
    if ww > 50 && hh > 50 {
        print("{\"x\":\(x),\"y\":\(y),\"w\":\(ww),\"h\":\(hh)}")
        break
    }
}
