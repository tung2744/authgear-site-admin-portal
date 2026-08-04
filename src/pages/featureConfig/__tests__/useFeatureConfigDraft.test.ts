import { act, renderHook, waitFor } from "@testing-library/react";
import useFeatureConfigDraft from "../useFeatureConfigDraft";
import * as siteadmin from "../../../api/siteadmin";
import type { AppFeatureConfigResponse } from "../../../api/types";

// An explicit factory, not a bare jest.mock(path), so Jest never has to load
// the real module -- api/siteadmin.ts transitively pulls in api/client.ts,
// which reads config.ts, which uses Vite's import.meta.env (ts-jest can't
// parse that). useFeatureConfigDraft.ts also imports SiteAdminAPIError
// directly from api/client, so mock config.ts itself (matching
// api/__tests__/client.test.ts's own pattern) rather than mocking client.ts
// and losing the real SiteAdminAPIError class the hook checks with
// `instanceof`.
jest.mock("../../../config", () => ({
  SITEADMIN_API_URL: "https://api.example.com",
}));
jest.mock("../../../api/siteadmin", () => ({
  getAppFeatureConfig: jest.fn(),
  previewAppFeatureConfig: jest.fn(),
  updateAppFeatureConfig: jest.fn(),
}));

const mockedGetAppFeatureConfig = jest.mocked(siteadmin.getAppFeatureConfig);
const mockedPreviewAppFeatureConfig = jest.mocked(
  siteadmin.previewAppFeatureConfig
);

function response(overrideYaml: string): AppFeatureConfigResponse {
  return {
    plan_name: "startups",
    effective_plan_feature_config: {},
    app_feature_config_yaml: overrideYaml,
    effective_app_feature_config: {},
  };
}

beforeEach(() => {
  jest.useFakeTimers();
  mockedGetAppFeatureConfig.mockResolvedValue(response(""));
  mockedPreviewAppFeatureConfig.mockResolvedValue(response(""));
});

afterEach(() => {
  jest.useRealTimers();
  jest.resetAllMocks();
});

test("does not call preview until the debounce elapses", async () => {
  const { result } = renderHook(() => useFeatureConfigDraft("app1"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  mockedPreviewAppFeatureConfig.mockClear(); // clear the initial-mount preview call

  act(() => {
    result.current.setYamlText("collaborator:\n  maximum: 3\n");
  });
  expect(mockedPreviewAppFeatureConfig).not.toHaveBeenCalled();

  await act(async () => {
    await jest.advanceTimersByTimeAsync(899);
  });
  expect(mockedPreviewAppFeatureConfig).not.toHaveBeenCalled();

  await act(async () => {
    await jest.advanceTimersByTimeAsync(1);
  });
  expect(mockedPreviewAppFeatureConfig).toHaveBeenCalledTimes(1);
  expect(mockedPreviewAppFeatureConfig).toHaveBeenCalledWith(
    "app1",
    "collaborator:\n  maximum: 3\n"
  );
});

test("triggerPreviewNow runs immediately and cancels the pending debounce", async () => {
  const { result } = renderHook(() => useFeatureConfigDraft("app1"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  mockedPreviewAppFeatureConfig.mockClear();

  act(() => {
    result.current.setYamlText("collaborator:\n  maximum: 3\n");
  });
  expect(mockedPreviewAppFeatureConfig).not.toHaveBeenCalled();

  await act(async () => {
    result.current.triggerPreviewNow();
    await Promise.resolve();
  });
  expect(mockedPreviewAppFeatureConfig).toHaveBeenCalledTimes(1);

  // The debounced call from setYamlText must not also fire later --
  // otherwise blurring right after typing would trigger two redundant
  // requests for the same, unchanged text.
  await act(async () => {
    await jest.advanceTimersByTimeAsync(2000);
  });
  expect(mockedPreviewAppFeatureConfig).toHaveBeenCalledTimes(1);
});
