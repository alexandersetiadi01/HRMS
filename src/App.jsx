
import GlobalLoadingOverlay from "./Components/GlobalLoadingOverlay";
import AppRoutes from "./Routes/AppRoutes";

function App() {
  return (
    <>
      <AppRoutes />
      <GlobalLoadingOverlay />
    </>
  );
}

export default App;
