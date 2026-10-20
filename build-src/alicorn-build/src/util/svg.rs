//! Renders SVG icons into fixed-size alpha masks.

use resvg::tiny_skia::Pixmap;
use resvg::tiny_skia::Transform;
use resvg::usvg::Tree;
use thiserror::Error;

/// A failure to parse or render an SVG icon.
#[derive(Debug, Error)]
pub enum SvgError {
    /// The SVG parser rejected the document or its dimensions.
    #[error("could not parse SVG")]
    Parse(#[from] resvg::usvg::Error),

    /// The side length cannot be represented by the renderer's pixel buffer.
    #[error("unsupported SVG side length {side}")]
    InvalidSide { side: u32 },

    /// The renderer could not create the requested pixel buffer.
    #[error("could not create a {side}-by-{side} SVG pixel buffer")]
    Pixmap { side: u32 },
}

/// Fits and renders the given SVG document into an alpha-only squared pixel
/// map, preserving its aspect ratio. The pixel map can later be colored
/// in monochrome.
///
/// The output buffer is a row-major representation produced by
/// [`Pixmap::pixels`], with each element denoting the alpha value of that
/// pixel.
pub fn render(svg: &[u8], side: u32) -> Result<Vec<u8>, SvgError> {
    let tree = Tree::from_data(svg, &Default::default())?;
    let svg_size = tree.size();
    let scale = side as f32 / svg_size.width().max(svg_size.height());
    let width = svg_size.width() * scale;
    let height = svg_size.height() * scale;
    let x_pad = (side as f32 - width) / 2.0;
    let y_pad = (side as f32 - height) / 2.0;
    let trans = Transform::from_row(scale, 0.0, 0.0, scale, x_pad, y_pad);
    let mut pixmap = Pixmap::new(side, side).ok_or(SvgError::Pixmap { side })?;
    resvg::render(&tree, trans, &mut pixmap.as_mut());
    Ok(pixmap.pixels().iter().map(|pixel| pixel.alpha()).collect())
}
