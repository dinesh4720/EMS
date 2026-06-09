import { useState } from "react";

import AuthBrand from "../../components/auth/AuthBrand";
import PasswordStrengthMeter from "../../components/auth/PasswordStrengthMeter";

import { Story, StoryGroup } from "./shared";

export default function AuthSection() {
  const [pwd, setPwd] = useState("Hello1!");

  return (
    <>
      <StoryGroup
        id="auth-brand"
        title="Auth"
        sub="Login, signup, and password components."
      >
        <Story title="AuthBrand" layout="row">
          <AuthBrand size="sm" />
          <AuthBrand size="lg" />
        </Story>

        <Story title="PasswordStrengthMeter" layout="col">
          <input
            type="text"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-border-token rounded-md text-sm mb-3"
            placeholder="Type a password…"
          />
          <PasswordStrengthMeter password={pwd} />
        </Story>
      </StoryGroup>
    </>
  );
}
