import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

// Generous async waits keep tests stable when many suites run in parallel on slower machines.
configure({ asyncUtilTimeout: 8000 });

afterEach(() => cleanup());
