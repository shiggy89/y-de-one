import MyPage from "./MyPage";
import DemoPhoneRedirect from "../_components/demo/DemoPhoneRedirect";
import DemoClientOnly from "../_components/demo/DemoClientOnly";

export default function Page() {
  return (
    <>
      <DemoPhoneRedirect />
      <DemoClientOnly>
        <MyPage />
      </DemoClientOnly>
    </>
  );
}
