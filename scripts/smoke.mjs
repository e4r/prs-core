// SPDX-FileCopyrightText: 2026 Leonardo Maria Miliacca
// SPDX-License-Identifier: AGPL-3.0-only

// Smoke test of the built ESM entry point, resolved through the package's own "exports".
import { frequencyFromRatio, createRatio, generateEquivalencePeriodScale } from '@e4r/prs-core';

const fifth = frequencyFromRatio(220, createRatio(3, 2));
if (Math.abs(fifth - 330) > 1e-9) throw new Error(`ESM build broken: expected 330, got ${fifth}`);
if (generateEquivalencePeriodScale(220, 2, 12).length !== 13) throw new Error('ESM build broken: scale length');
console.log('ESM smoke test OK');
