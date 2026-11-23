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

#[test]
fn cascade_fits_saved_origin_to_the_current_screen() {
    let screen = ScreenBounds {
        width: 640,
        height: 480,
        taskbar_height: 40,
    };
    // The old screen allowed (500, 400); the current one can fit the window
    // no farther right than 320 or below 200 once the taskbar is reserved.
    let windows = CascadeLayout::calculate(screen, 2, 500, 400, -10, -10, 320, 240);
    assert_eq!((windows[0].x, windows[0].y), (320, 200));
    assert_eq!((windows[1].x, windows[1].y), (310, 190));
    assert!(windows
        .iter()
        .all(|window| (window.width, window.height) == (320, 240)));

    let windows = CascadeLayout::calculate(screen, 2, -20, -10, -5, 10, 320, 240);
    assert_eq!((windows[0].x, windows[0].y), (0, 0));
    assert_eq!((windows[1].x, windows[1].y), (0, 0));
}
