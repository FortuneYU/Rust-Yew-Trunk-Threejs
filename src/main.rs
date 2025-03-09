use yew::prelude::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    fn initThreeJS(container: &web_sys::Element);
}

struct App;

impl Component for App {
    type Message = ();
    type Properties = ();

    fn create(ctx: &Context<Self>) -> Self {
        App
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        true
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        html! {
            <div>
                <h1>{"PLY Viewer"}</h1>
                <div id="threejs-container" style="width: 100%; height: 500px;"></div>
            </div>
        }
    }

    fn rendered(&mut self, ctx: &Context<Self>, first_render: bool) {
        if first_render {
            let window = web_sys::window().unwrap();
            let document = window.document().unwrap();
            let container = document.get_element_by_id("threejs-container").unwrap();
            
            
            //initThreeJS(&container);
             // Delay the call to initThreeJS
            let closure = Closure::wrap(Box::new(move || {
                initThreeJS(&container);
            }) as Box<dyn Fn()>);
            window
                .set_timeout_with_callback_and_timeout_and_arguments_0(
                    closure.as_ref().unchecked_ref(),
                    100, // Delay by 100ms
                )
                .unwrap();
            closure.forget(); // Prevent memory leak
        }
    }
}

fn main() {
    yew::Renderer::<App>::new().render();
}