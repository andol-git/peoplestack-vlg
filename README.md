# PeopleStack — Enterprise Workforce Management

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run admin portal
npx nx serve admin-portal

# Opens at http://localhost:4200
# Login with your Spring Boot credentials
```

## Project Structure

```
apps/
  admin-portal/     → HR/Ops admin app (http://localhost:4200)

libs/
  auth/             → Login, AuthFacade, AuthStore, AuthService
  feature-dashboard/→ Dashboard with stats
  feature-employee/ → Employee list + 9-step form + facade
  feature-customer/ → Customer list + Assign Staff
  feature-attendance/ → Biometric attendance dashboard
  shared-ui/        → Shared models/interfaces
```

## API Config

Edit `apps/admin-portal/src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiBase: 'http://YOUR_SERVER_IP:8080/vlg_service_v1/api'
};
```

## CORS Fix (Spring Boot)

Add to your Spring Boot:
```java
@Bean
public CorsFilter corsFilter() {
    CorsConfiguration config = new CorsConfiguration();
    config.addAllowedOrigin("http://localhost:4200");
    config.addAllowedHeader("*");
    config.addAllowedMethod("*");
    config.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return new CorsFilter(source);
}
```

## Features
- ✅ JWT Login → Dashboard
- ✅ Employee List (Bootstrap table)
- ✅ 9-step Employee Form (all 16 screens)
- ✅ Shell with collapsible sidebar
- ✅ Assign Staff to Customers
- ✅ Attendance dashboard (ZKTeco K40 Pro ready)
- ✅ Auth guard + JWT interceptor
- ✅ Angular Signals state management
- ✅ Facade pattern throughout
