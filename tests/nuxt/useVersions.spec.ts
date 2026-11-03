import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { clearNuxtState } from "#imports";

const fetchMock = vi.hoisted(() => vi.fn());

mockNuxtImport("$fetch", () => fetchMock);

const VERSION_URL = "https://poke.test/api/v2/version?limit=100";

const versionList = (...names: string[]) => ({ results: names.map((name) => ({ name })) });

beforeEach(() => {
  fetchMock.mockReset();
  clearNuxtState();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("useVersions", () => {
  it("loads the PokeAPI version list once and keeps the default version", async () => {
    fetchMock.mockResolvedValueOnce(versionList("red", "scarlet"));

    const { versions, selectedVersion } = useVersions();

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(VERSION_URL);
    expect(versions.value).toEqual(["red", "scarlet"]);
    expect(selectedVersion.value).toBe("red");
  });

  it("falls back to the first version when the default is missing", async () => {
    fetchMock.mockResolvedValueOnce(versionList("scarlet", "violet"));

    const { selectedVersion } = useVersions();

    await vi.waitFor(() => expect(selectedVersion.value).toBe("scarlet"));
  });

  it("does not refetch when the list is already populated", async () => {
    fetchMock.mockResolvedValueOnce(versionList("red"));

    const { loadVersions } = useVersions();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await loadVersions();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("swallows a PokeAPI failure and leaves the list empty", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));

    const { versions, loadVersions } = useVersions();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await loadVersions();

    expect(versions.value).toEqual([]);
  });

  it("shares the selected version through useState", () => {
    fetchMock.mockResolvedValue([]);
    useState("selected-version").value = "red";

    const { selectVersion } = useVersions();
    selectVersion("scarlet");

    expect(useState("selected-version").value).toBe("scarlet");
    expect(useTeam().selectedVersion.value).toBe("scarlet");
  });
});
