import RegisterForm from "./RegisterForm";
import DemoPhoneRedirect from "../_components/demo/DemoPhoneRedirect";
import DemoClientOnly from "../_components/demo/DemoClientOnly";

export default function RegisterPage() {
  return (
    <>
      <DemoPhoneRedirect />
      <DemoClientOnly>
        <RegisterForm />
      </DemoClientOnly>
    </>
  );
}
