use openbrowser_core::sync::{CascadeLayout, ScreenBounds, TileGridLayout};

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

#[test]
fn tile_grid_adapts_when_only_a_non_square_grid_fits() {
    let (count, margin, gap) = (100, 8, 40);
    let taskbar_height = 40;
    for (width, height, expected_columns) in [(320, 1320, 8), (1280, 360, 13)] {
        let screen = ScreenBounds {
            width,
            height,
            taskbar_height,
        };
        let windows = TileGridLayout::calculate(screen, count, margin, gap).unwrap();
        assert_eq!(windows.len(), count);
        let columns = windows
            .iter()
            .take_while(|window| window.y == windows[0].y)
            .count();
        assert_eq!(columns, expected_columns);
        for (index, window) in windows.iter().enumerate() {
            let x = u32::try_from(window.x).unwrap();
            let y = u32::try_from(window.y).unwrap();
            assert!(window.width > 0 && window.height > 0);
            assert_eq!(x, margin + (index % columns) as u32 * (window.width + gap));
            assert_eq!(y, margin + (index / columns) as u32 * (window.height + gap));
            assert!(x + window.width + margin <= width);
            assert!(y + window.height + margin + taskbar_height <= height);
        }
    }

    let too_small = ScreenBounds {
        width: 320,
        height: 360,
        taskbar_height,
    };
    assert!(TileGridLayout::calculate(too_small, count, margin, gap).is_err());
}
