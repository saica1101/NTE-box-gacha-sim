import { defineConfig } from "vite";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === "true";
const isUserPagesRepository = repository.endsWith(".github.io");

const base =
    process.env.VITE_BASE_PATH ??
    (isGitHubPagesBuild && !isUserPagesRepository ? `/${repository}/` : "/");

export default defineConfig({
    base,
});
