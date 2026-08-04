export const siteConfig = {
  name: "Signalbrief",
  title: "Signalbrief — Walk into every call ready",
  description: "Open-source, just-in-time account research delivered to every seller in Slack.",
  url: "https://signalbrief-alpha.vercel.app",
  repositoryUrl: "https://github.com/mherzog4/signalbrief",
} as const;

export function getRepositoryLinks(repositoryUrl: string = siteConfig.repositoryUrl) {
  return {
    deployment: `${repositoryUrl}#deploy-on-vercel`,
    documentation: `${repositoryUrl}/blob/main/docs/interview-demo.md`,
    configuration: `${repositoryUrl}#configure-providers`,
    help: `${repositoryUrl}/issues/new`,
  } as const;
}
