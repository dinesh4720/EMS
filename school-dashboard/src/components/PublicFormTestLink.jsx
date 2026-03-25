import { useState } from "react";
import { Input, Button, Card, CardBody } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { useTranslation } from 'react-i18next';

/**
 * PublicFormTestLink - Development utility for testing public forms
 *
 * This component helps developers test the public form submission feature
 * by generating test links for different scenarios.
 *
 * NOTE: This should only be used in development environments.
 */

export default function PublicFormTestLink() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [token, setToken] = useState("");

  const testScenarios = [
    {
      name: "Valid Active Form",
      token: "test-valid-token-123",
      description: "A valid, active form token",
    },
    {
      name: "Expired Form",
      token: "test-expired-token-456",
      description: "An expired form token",
    },
    {
      name: "Invalid Token",
      token: "invalid-token-789",
      description: "An invalid/non-existent token",
    },
    {
      name: "Already Submitted",
      token: "test-submitted-token-012",
      description: "A form that's already been submitted",
    },
  ];

  const handleTestToken = (testToken) => {
    navigate(`/form/${testToken}`);
  };

  const handleCustomToken = () => {
    if (token.trim()) {
      navigate(`/form/${token.trim()}`);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardBody className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-bold mb-1">{t('components.publicFormTestUtility')}</h3>
          <p className="text-sm text-default-500">
            Test different public form scenarios. This is for development purposes only.
          </p>
        </div>

        {/* Custom Token Input */}
        <div className="flex gap-2">
          <Input
            placeholder={t('components.enterCustomToken')}
            value={token}
            onValueChange={setToken}
            onKeyPress={(e) => e.key === "Enter" && handleCustomToken()}
            variant="bordered"
            classNames={{
              input: "text-foreground",
              label: "text-foreground/70",
              inputWrapper: "border-default-200",
            }}
          />
          <Button
            color="primary"
            variant="solid"
            onPress={handleCustomToken}
            isDisabled={!token.trim()}
            endContent={<ExternalLink className="w-4 h-4" />}
          >
            Test
          </Button>
        </div>

        {/* Test Scenarios */}
        <div>
          <h4 className="text-sm font-semibold mb-3 text-foreground/70">
            Predefined Test Scenarios
          </h4>
          <div className="grid gap-2">
            {testScenarios.map((scenario) => (
              <Button
                key={scenario.token}
                variant="flat"
                color="default"
                onPress={() => handleTestToken(scenario.token)}
                className="justify-start text-left h-auto py-3 px-4"
              >
                <div className="flex items-center justify-between w-full">
                  <div>
                    <div className="font-medium">{scenario.name}</div>
                    <div className="text-xs text-default-500 mt-0.5">
                      {scenario.description}
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-default-400 flex-shrink-0 ml-2" />
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-default-100 dark:bg-default-50/10 rounded-lg p-3 text-xs text-default-600 dark:text-default-400">
          <strong>{t('components.note')}</strong> These test tokens need to be set up in your backend
          database to work properly. The tokens shown here are examples - replace them
          with actual tokens from your development database.
        </div>
      </CardBody>
    </Card>
  );
}
