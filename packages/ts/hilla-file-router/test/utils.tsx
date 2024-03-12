import { appendFile, mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ComponentType, JSX } from 'react';
import sinon from 'sinon';
import type { Logger } from 'vite';
import type { ServerViewConfig } from '../src/shared/internal.js';
import { RouteParamType } from '../src/shared/routeParamType.js';
import type { AgnosticRoute, RouteModule } from '../src/types.js';
import type { RouteMeta } from '../src/vite-plugin/collectRoutesFromFS.js';

export async function createTmpDir(): Promise<URL> {
  return pathToFileURL(`${await mkdtemp(join(tmpdir(), 'hilla-file-router-'))}/`);
}

export async function createTestingRouteFiles(dir: URL): Promise<void> {
  // Generates the following directory structure:
  // root
  // ├── profile
  // │   ├── account
  // │   │   ├── layout.tsx
  // │   │   └── security
  // │   │       ├── password.jsx
  // │   │       └── two-factor-auth.ts
  // │   ├── friends
  // │   │   ├── layout.tsx
  // │   │   ├── list.js
  // │   │   └── {user}.tsx
  // │   ├── index.tsx
  // │   └── index.css
  // ├── test
  // │  ├── {{optional}}.tsx
  // │  ├── {...wildcard}.tsx
  // │  └── empty.tsx
  // └── nameToReplace.tsx

  await Promise.all([
    mkdir(new URL('profile/account/security/', dir), { recursive: true }),
    mkdir(new URL('profile/friends/', dir), { recursive: true }),
    mkdir(new URL('test/', dir), { recursive: true }),
  ]);
  await Promise.all([
    appendFile(
      new URL('profile/account/$layout.tsx', dir),
      "export const config = { title: 'Account' };\nexport default function AccountLayout() {};",
    ),
    appendFile(new URL('profile/account/security/password.jsx', dir), 'export default function Password() {};'),
    appendFile(new URL('profile/account/security/password.scss', dir), ''),
    appendFile(
      new URL('profile/account/security/two-factor-auth.ts', dir),
      'export default function TwoFactorAuth() {};',
    ),
    appendFile(new URL('profile/friends/$layout.tsx', dir), 'export default function FriendsLayout() {};'),
    appendFile(
      new URL('profile/friends/list.js', dir),
      "export const config = { title: 'List' };\nexport default function List() {};",
    ),
    appendFile(
      new URL('profile/friends/{user}.tsx', dir),
      "export const config = { title: 'User' };\nexport default function User() {};",
    ),
    appendFile(
      new URL('profile/$index.tsx', dir),
      "export const config = { title: 'Profile' };\nexport default function Profile() {};",
    ),
    appendFile(new URL('profile/index.css', dir), ''),
    appendFile(
      new URL('nameToReplace.tsx', dir),
      "export const config = { route: 'about', title: 'About' };\nexport default function About() {};",
    ),
    appendFile(
      new URL('test/{...wildcard}.tsx', dir),
      "export const config = { title: 'Wildcard' };\nexport default function Wildcard() {};",
    ),
    appendFile(
      new URL('test/{{optional}}.tsx', dir),
      "export const config = { title: 'Optional' };\nexport default function Optional() {};",
    ),
    appendFile(new URL('test/empty.tsx', dir), ''),
    appendFile(new URL('test/_ignored.tsx', dir), 'export default function Ignored() {};'),
    appendFile(new URL('test/no-default-export.tsx', dir), 'export const config = { title: "No Default Export" };'),
  ]);
}

export function createTestingRouteMeta(dir: URL): RouteMeta {
  return {
    path: '',
    children: [
      {
        path: 'nameToReplace',
        file: new URL('nameToReplace.tsx', dir),
        children: [],
      },
      {
        path: 'profile',
        children: [
          { path: '', file: new URL('profile/$index.tsx', dir), children: [] },
          {
            path: 'account',
            layout: new URL('profile/account/$layout.tsx', dir),
            children: [
              {
                path: 'security',
                children: [
                  {
                    path: 'password',
                    file: new URL('profile/account/security/password.jsx', dir),
                    children: [],
                  },
                  {
                    path: 'two-factor-auth',
                    file: new URL('profile/account/security/two-factor-auth.ts', dir),
                    children: [],
                  },
                ],
              },
            ],
          },
          {
            path: 'friends',
            layout: new URL('profile/friends/$layout.tsx', dir),
            children: [
              {
                path: 'list',
                file: new URL('profile/friends/list.js', dir),
                children: [],
              },
              {
                path: '{user}',
                file: new URL('profile/friends/{user}.tsx', dir),
                children: [],
              },
            ],
          },
        ],
      },
      {
        path: 'test',
        children: [
          // Ignored route (that has the name `_ignored.tsx` is not included in the route meta.
          {
            // Empty route doesn't have any `file` or `layout` property because the file itself is empty.
            // We keep the path though.
            path: 'empty',
            children: [],
          },
          {
            path: '{{optional}}',
            file: new URL('test/{{optional}}.tsx', dir),
            children: [],
          },
          {
            path: '{...wildcard}',
            file: new URL('test/{...wildcard}.tsx', dir),
            children: [],
          },
          {
            path: 'no-default-export',
            file: new URL('test/no-default-export.tsx', dir),
            children: [],
          },
        ],
      },
    ],
  };
}

export const components = {
  about: {
    // eslint-disable-next-line func-name-matching
    default: function About(): JSX.Element {
      return <></>;
    },
    config: { title: 'About', menu: { order: 1 } },
  },
  friends: {
    // eslint-disable-next-line func-name-matching
    default: function Friends(): JSX.Element {
      return <></>;
    },
    config: { title: 'Friends' },
  },
  friendsList: {
    // eslint-disable-next-line func-name-matching
    default: function FriendsList(): JSX.Element {
      return <></>;
    },
    config: { title: 'Friends List', route: 'friends-list' },
  },
  friend: {
    // eslint-disable-next-line func-name-matching
    default: function Friend(): JSX.Element {
      return <></>;
    },
    config: { title: 'Friend' },
  },
  hidden: {
    // eslint-disable-next-line func-name-matching
    default: function Hidden(): JSX.Element {
      return <></>;
    },
    config: { menu: { exclude: true } },
  },
  wildcard: {
    // eslint-disable-next-line func-name-matching
    default: function Wildcard(): JSX.Element {
      return <></>;
    },
    config: { title: 'Wildcard' },
  },
  optional: {
    // eslint-disable-next-line func-name-matching
    default: function Optional(): JSX.Element {
      return <></>;
    },
    config: { title: 'Optional' },
  },
  server: {
    // eslint-disable-next-line func-name-matching
    default: function Server(): JSX.Element {
      return <></>;
    },
    config: { title: 'Server' },
  },
} satisfies Record<string, RouteModule>;

export function createTestingAgnosticRoutes(): AgnosticRoute<ComponentType> {
  return {
    path: '',
    children: [
      {
        path: 'about',
        module: components.about,
      },
      {
        path: 'hidden',
        module: components.hidden,
      },
      {
        path: 'profile',
        children: [
          {
            path: 'friends',
            module: components.friends,
            children: [
              {
                path: 'list',
                module: components.friendsList,
              },
              {
                path: ':user',
                module: components.friend,
              },
            ],
          },
        ],
      },
      {
        path: 'test',
        children: [
          {
            path: '*',
            module: components.wildcard,
          },
          {
            path: ':optional?',
            module: components.optional,
          },
        ],
      },
    ],
  };
}

export function createTestingViewMap(): Record<string, ServerViewConfig> {
  return {
    '/about': { route: 'about', title: 'About' },
    '/profile/': { title: 'Profile' },
    '/profile/account/security/password': { title: 'Password' },
    '/profile/account/security/two-factor-auth': { title: 'Two Factor Auth' },
    '/profile/friends/list': { title: 'List' },
    '/profile/friends/:user': { title: 'User', params: { ':user': RouteParamType.Required } },
    '/test/empty': {},
    '/test/:optional?': { title: 'Optional', params: { ':optional?': RouteParamType.Optional } },
    '/test/*': { title: 'Wildcard', params: { '*': RouteParamType.Wildcard } },
    '/test/no-default-export': { title: 'No Default Export' },
  };
}

export function createLogger(): Logger {
  return {
    info: sinon.stub(),
    warn: sinon.stub(),
    warnOnce: sinon.stub(),
    error: sinon.stub(),
    clearScreen: sinon.stub(),
    hasErrorLogged: sinon.stub(),
    hasWarned: false,
  };
}