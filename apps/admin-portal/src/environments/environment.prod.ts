import { AppConfig } from "@ps/shared/models";

export const environment = {
  production: true,
};

export const APP_CONFIG_VALUE: AppConfig = {
  appName: "VLG PeopleStack",
  appShortName: "VLG",
  logoUrl: "/assets/logo.svg",
  faviconUrl: "/assets/favicon.ico",
  primaryColor: "#6366f1",
  apiBaseUrl: "http://165.232.184.121:8080/vlg_service_v1",
  supportEmail: "support@vlgservices.com",
  companyName: "VLG Services Pvt. Ltd.",
};
