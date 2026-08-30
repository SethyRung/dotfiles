export type UpstreamInstall = {
  url: string;
  shell?: string;
  env?: Record<string, string>;
  via?: "pipe" | "sh-c" | "git-clone";
  then?: string;
  dest?: string;
};
