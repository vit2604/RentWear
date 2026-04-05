import { render, screen } from "@testing-library/react";
import App from "./App";
import { AppProvider } from "./context/AppContext";

test("renders hero title", () => {
  render(
    <AppProvider>
      <App />
    </AppProvider>
  );

  expect(screen.getByText(/tinh hoa thời trang cho thuê/i)).toBeInTheDocument();
});
