import {
  NavigationClient,
  type NavigationOptions,
} from "@azure/msal-browser";
import type { NextRouter } from "next/router";

export class CustomNavigationClient extends NavigationClient {
  private router: NextRouter;

  constructor(router: NextRouter) {
    super();
    this.router = router;
  }

  async navigateInternal(
    url: string,
    options: NavigationOptions
  ): Promise<boolean> {
    const relativePath = url.replace(window.location.origin, "");
    if (options.noHistory) {
      await this.router.replace(relativePath);
    } else {
      await this.router.push(relativePath);
    }
    return false;
  }
}
