
Build a responsive, modular e-commerce web application in Angular for a custom wall-mounted folding desk builder (similar to a premium "Droptop" desk).

The application must feature an interactive visual product customizer where customers can design their desk layout using a drag-and-drop or grid-based interface.

### Key Requirements & Features:

1. **Outer Shell & Dimension Configurator:**

   - Allow users to input or select master dimensions (Width, Height, Depth) with strict validation boundaries (e.g., min/max width to ensure structural safety).
   - Color and material picker for outer casing and inner backboard panels (e.g., Matte Black, Walnut Wood Grain, Pure White).
2. **Interactive Visual Layout Canvas:**

   - Implement an interactive canvas area (using HTML5 Canvas, SVG, or a flexible grid framework like Angular CDK drag-and-drop) representing the inside of the desk cabinet.
   - **Component Drag-and-Drop / Placement:** Users can drop elements onto the canvas, including:
     - Monitors & Laptops (representing single displays up to quad-monitor setups: 1, 2, 3, or 4 screens).
     - Compartments, vertical/horizontal dividers, and adjustable shelves.
     - Accessory hotspots (USB hubs, cable pass-throughs, LED strips).
   - **Real-time Validation Engine:** If a user places too many monitors or heavy components that exceed the selected box size or weight limit, display a warning/error state and enforce scaling up the desk size or selecting heavy-duty hardware upgrades.
3. **Dynamic Pricing & Bill of Materials (BOM):**

   - Live price calculation updating instantly as the user changes dimensions, adds internal compartments, or scales up hardware requirements.
   - A summary side panel showing a live breakdown of dimensions, selected materials, hardware weight load estimates, and total price.
4. **Production Payload Generation (Checkout / Save Spec):**

   - Upon clicking "Save Design" or "Request Custom Quote," serialize the canvas state and component configuration into a structured JSON payload.
   - The JSON must capture exact millimeter dimensions, internal divider coordinates, wall-mounting type (e.g., solid concrete brick vs. drywall), and hardware requirements (e.g., heavy-duty gas struts, reinforced backplate) for the manufacturing team.
5. **Angular Architecture & Styling:**

   - Use Angular standalone components, reactive forms for the measurement inputs, and a clean, modern UI layout (Tailwind CSS preferred).
   - Ensure clean state management so changes in the visual canvas sync instantly with the summary configuration state.
