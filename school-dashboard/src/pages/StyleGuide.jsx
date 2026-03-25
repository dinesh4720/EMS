import React from "react";
import FormInput from "../components/FormInput";
import { Mail, Lock, Search, User } from "lucide-react";
import { Card, Button } from "@heroui/react";
import { useTranslation } from 'react-i18next';

export default function StyleGuide() {
  const { t } = useTranslation();
    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('pages.designStyleGuide')}</h1>
                <p className="text-gray-500 dark:text-zinc-500">{t('pages.coreUiComponentsAndDesignTokensUsedThroughoutTheApplication')}</p>
            </div>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">{t('pages.formInputs')}</h2>
                <Card className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormInput
                            label={t('pages.defaultInput')}
                            placeholder={t('pages.typeSomething')}
                        />

                        <FormInput
                            label={t('pages.withIcon')}
                            placeholder={t('pages.search1')}
                            startContent={<Search size={18} />}
                        />

                        <FormInput
                            label={t('pages.emailAddress')}
                            type="email"
                            placeholder="john@example.com"
                            startContent={<Mail size={18} />}
                        />

                        <FormInput
                            label={t('pages.password')}
                            type="password"
                            placeholder={t('pages.enterPassword')}
                            startContent={<Lock size={18} />}
                        />

                        <FormInput
                            label={t('pages.errorState')}
                            placeholder={t('pages.invalidInput')}
                            error="This field is required"
                            startContent={<User size={18} />}
                        />
                    </div>
                </Card>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">{t('pages.colors')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <div className="h-20 rounded-lg bg-primary shadow-sm"></div>
                        <p className="text-sm font-medium">{t('pages.primary')}</p>
                    </div>
                    <div className="space-y-2">
                        <div className="h-20 rounded-lg bg-secondary shadow-sm"></div>
                        <p className="text-sm font-medium">{t('pages.secondary')}</p>
                    </div>
                    <div className="space-y-2">
                        <div className="h-20 rounded-lg bg-success shadow-sm"></div>
                        <p className="text-sm font-medium">{t('pages.success1')}</p>
                    </div>
                    <div className="space-y-2">
                        <div className="h-20 rounded-lg bg-danger shadow-sm"></div>
                        <p className="text-sm font-medium">{t('pages.danger')}</p>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">{t('pages.typography')}</h2>
                <Card className="p-6 space-y-4">
                    <h1 className="text-4xl font-bold">{t('pages.heading1')}</h1>
                    <h2 className="text-3xl font-bold">{t('pages.heading2')}</h2>
                    <h3 className="text-2xl font-semibold">{t('pages.heading3')}</h3>
                    <h4 className="text-xl font-medium">{t('pages.heading4')}</h4>
                    <p className="text-base text-gray-600 dark:text-zinc-400">Body text: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                    <p className="text-sm text-gray-500 dark:text-zinc-500">{t('pages.smallTextLoremIpsumDolorSitAmetConsecteturAdipiscingElit')}</p>
                </Card>
            </section>
        </div>
    );
}
