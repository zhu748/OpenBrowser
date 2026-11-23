use openbrowser_core::sync::{CascadeLayout, ScreenBounds};

#[test]
fn cascade_wraps_after_crossing_left_or_top_edge() {
    let screen = ScreenBounds {
        width: 640,
        height: 480,
        taskbar_height: 40,
    };
    for (offset_x, offset_y, second_origin) in [(-25, 10, (0, 35)), (10, -25, (35, 0))] {
        let windows = CascadeLayout::calculate(screen, 3, 25, 25, offset_x, offset_y, 320, 240);
        let origins: Vec<_> = windows.iter().map(|window| (window.x, window.y)).collect();
        assert_eq!(origins, [(25, 25), second_origin, (25, 25)]);
    }
}
