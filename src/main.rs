fn main() -> iced::Result {
    iced::application(|| (), |_: &mut (), _: ()| {}, view)
        .title("Alicorn")
        .run()
}

fn view(_: &()) -> iced::Element<'_, ()> { iced::widget::space().into() }
