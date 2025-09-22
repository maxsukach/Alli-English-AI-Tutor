"use client";

import { useState } from "react";
import { Mail01 } from "@untitledui/icons";
import { PaginationLine } from "@/components/application/pagination/pagination-line";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { UntitledLogoMinimal } from "@/components/foundations/logo/untitledui-logo-minimal";
import { BackgroundPattern } from "@/components/shared-assets/background-patterns";
import { ProgressIconsWithText } from "./progress-steps";

export const SignupSidebarProgress02 = () => {
    const [password, setPassword] = useState("");

    return (
        <section className="grid min-h-screen grid-cols-1 overflow-hidden bg-primary lg:grid-cols-[440px_1fr]">
            <div className="hidden max-w-md min-w-100 flex-4 flex-col justify-between bg-brand-section lg:flex">
                <div className="flex flex-col gap-20 px-8 pt-8">
                    <UntitledLogo className="dark-mode" />

                    <div className="pr-8">
                        <ProgressIconsWithText
                            size="md"
                            items={[
                                {
                                    title: "Your details",
                                    description: "Please provide your name and email",
                                    status: "complete",
                                },
                                {
                                    title: "Choose a password",
                                    description: "Choose a secure password",
                                    status: "current",
                                },
                                {
                                    title: "Invite your team",
                                    description: "Start collaborating with your team",
                                    status: "incomplete",
                                },
                                {
                                    title: "Add your socials",
                                    description: "Share posts to your social accounts",
                                    status: "incomplete",
                                },
                            ]}
                        />
                    </div>
                </div>

                <footer className="hidden justify-between p-8 lg:flex">
                    <p className="text-sm text-tertiary_on-brand">© Untitled UI 2077</p>

                    <a href="mailto:help@untitledui.com" className="flex items-center gap-2 text-sm text-tertiary_on-brand">
                        <Mail01 className="size-4 text-icon-fg-brand_on-brand" />
                        help@untitledui.com
                    </a>
                </footer>
            </div>

            <div className="relative flex w-full flex-col items-center gap-8 px-4 py-12 md:px-8 lg:pt-40 lg:pb-24">
                <div className="flex w-full flex-col gap-8 sm:max-w-90">
                    <div className="flex flex-col items-center gap-6 text-center md:gap-8">
                        <div className="relative">
                            <UntitledLogoMinimal className="relative z-10 size-12 max-md:hidden" />
                            <UntitledLogoMinimal className="relative z-10 size-10 md:hidden" />

                            <BackgroundPattern
                                pattern="circle"
                                size="lg"
                                className="absolute top-1/2 left-1/2 z-0 hidden -translate-x-1/2 -translate-y-1/2 md:block"
                            />
                            <BackgroundPattern
                                pattern="circle"
                                size="md"
                                className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 md:hidden"
                            />
                        </div>
                        <div className="z-10 flex flex-col gap-2 md:gap-3">
                            <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">Choose a password</h1>
                            <p className="text-md text-tertiary">Must be at least 8 characters.</p>
                        </div>
                    </div>

                    <Form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const data = Object.fromEntries(new FormData(e.currentTarget));
                            console.log("Form data:", data);
                        }}
                        className="z-10 flex flex-col gap-6"
                    >
                        <div className="flex flex-col gap-5">
                            <Input isRequired type="password" name="password" size="md" placeholder="Choose a password" onChange={setPassword} />
                            <Input
                                isRequired
                                type="password"
                                name="password_confirm"
                                size="md"
                                placeholder="Confirm password"
                                validate={(value) => value === password || "Passwords do not match"}
                            />
                        </div>

                        <div className="flex flex-col gap-4">
                            <Button type="submit" size="lg">
                                Continue
                            </Button>
                        </div>
                    </Form>
                </div>

                <div className="bottom-16 left-1/2 flex w-full justify-center sm:max-w-90 md:absolute md:mt-auto md:-translate-x-1/2">
                    <PaginationLine page={2} total={4} size="lg" className="w-full" />
                </div>
            </div>
        </section>
    );
};
