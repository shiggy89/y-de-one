import AdminPanel from "./AdminPanel";
import DemoPhoneRedirect from "../_components/demo/DemoPhoneRedirect";
import DemoClientOnly from "../_components/demo/DemoClientOnly";

export default function AdminPage() {
  return (
    <>
      <DemoPhoneRedirect />
      <DemoClientOnly>
        <AdminPanel />
      </DemoClientOnly>
    </>
  );
}
