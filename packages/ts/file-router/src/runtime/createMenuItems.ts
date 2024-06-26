import type { VaadinWindow } from '../shared/internal.js';
import type { MenuItem, ViewConfig } from '../types.js';

/**
 * Creates menu items from the views provided by the server. The views are sorted according to the
 * {@link ViewConfig.menu.order}, filtered out if they are explicitly excluded via {@link ViewConfig.menu.exclude}.
 * Note that views with no order are put below views with an order. Ties are resolved based on the path string
 * comparison.
 *
 * @param vaadinObject - The Vaadin object containing the server views.
 * @returns A list of menu items.
 */
export function createMenuItems(vaadinObject = (window as VaadinWindow).Vaadin): readonly MenuItem[] {
  // @ts-expect-error: esbuild injection
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  __REGISTER__('createMenuItems', vaadinObject);
  const collator = new Intl.Collator('en-US');
  return vaadinObject?.views
    ? Object.entries(vaadinObject.views)
        // Filter out the views that are explicitly excluded from the menu.
        .filter(([_, value]) => !value.menu?.exclude)
        // Map the views to menu items.
        .map(([path, config]) => ({
          to: path,
          icon: config.menu?.icon,
          title: config.menu?.title ?? config.title,
          order: config.menu?.order,
        }))
        // Sort views according to the order specified in the view configuration.
        .sort((menuA, menuB) => {
          const ordersDiff = (menuA.order ?? Number.MAX_VALUE) - (menuB.order ?? Number.MAX_VALUE);
          return ordersDiff !== 0 ? ordersDiff : collator.compare(menuA.to, menuB.to);
        })
    : [];
}
