import { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Github, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { projects } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Projects",
  description: "A showcase of my projects, open-source contributions, and side experiments.",
};

export default function ProjectsPage() {
  const previewProjects = projects.filter((p) => p.preview);
  const otherProjects = projects.filter((p) => !p.preview);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-16 animate-fade-in">
      <h1 className="text-4xl font-bold tracking-tight mb-4">Projects</h1>
      <p className="text-lg text-muted-foreground mb-12">
        A collection of things I&apos;ve built, contributed to, and experimented with.
      </p>

      {/* Featured / Preview Projects */}
      <div className="grid gap-6 md:grid-cols-2">
        {previewProjects.map((project) => (
          <Card
            key={project.id}
            className="group hover:shadow-md transition-all"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {project.title}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="text-xs text-green-600 border-green-600/30"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {project.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  {project.link && (
                    <Link
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="Live Preview"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  )}
                  <Link
                    href={project.gitlink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Source Code"
                  >
                    <Github className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <CardDescription className="mt-2">{project.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Insights (Lighthouse scores) */}
              {"insights" in project && project.insights && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Lighthouse Scores</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.entries(project.insights).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex flex-col items-center rounded-lg border p-2"
                        >
                          <span
                            className={`text-xl font-bold ${
                              Number(value) >= 96
                                ? "text-green-500"
                                : Number(value) >= 80
                                ? "text-yellow-500"
                                : "text-red-500"
                            }`}
                          >
                            {value}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {key === "bestPractices" ? "Best Practices" : key}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Frontend Features */}
              {"frontend" in project && project.frontend && (
                <>
                  <Separator />
                  <details className="group/details">
                    <summary className="text-sm font-medium cursor-pointer hover:text-primary transition-colors">
                      Frontend Features ({project.frontend.length})
                    </summary>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
                      {project.frontend.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </details>
                </>
              )}

              {/* Backend Features */}
              {"backend" in project && project.backend && (
                <>
                  <details className="group/details">
                    <summary className="text-sm font-medium cursor-pointer hover:text-primary transition-colors">
                      Backend Features ({project.backend.length})
                    </summary>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
                      {project.backend.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </details>
                </>
              )}

              {/* Generic Features */}
              {"features" in project && project.features && project.features.length > 0 && (
                <>
                  <Separator />
                  <details className="group/details">
                    <summary className="text-sm font-medium cursor-pointer hover:text-primary transition-colors">
                      Features ({project.features.length})
                    </summary>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
                      {project.features.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </details>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Other Projects (non-preview) */}
      {otherProjects.length > 0 && (
        <>
          <Separator className="my-12" />
          <h2 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-2">
            <EyeOff className="h-5 w-5 text-muted-foreground" />
            Other Projects
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Projects without a live preview — source code available on GitHub.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            {otherProjects.map((project) => (
              <Card key={project.id} className="group hover:shadow-md transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {project.title}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="text-xs text-green-600 border-green-600/30"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      {project.link && (
                        <Link
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Live Preview"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      )}
                      <Link
                        href={project.gitlink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Source Code"
                      >
                        <Github className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                  <CardDescription className="mt-2">{project.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {"features" in project && project.features && project.features.length > 0 && (
                    <>
                      <Separator />
                      <details className="group/details">
                        <summary className="text-sm font-medium cursor-pointer hover:text-primary transition-colors">
                          Features ({project.features.length})
                        </summary>
                        <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
                          {project.features.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </details>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
