import AppLayout from '@/Layouts/AppLayout';
import DoctorLayout, { DoctorPageHeader } from '@/Layouts/DoctorLayout';
import PatientLayout from '@/Layouts/PatientLayout';
import { Head } from '@inertiajs/react';

function slugify(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function InlineMarkdown({ text }) {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);

    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={`${part}-${index}`} className="font-semibold text-slate-950">{part.slice(2, -2)}</strong>;
        }

        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={`${part}-${index}`} className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.95em] text-slate-800">{part.slice(1, -1)}</code>;
        }

        return <span key={`${part}-${index}`}>{part}</span>;
    });
}

function parseNodeToken(token) {
    const trimmed = token.trim();

    if (!trimmed) {
        return null;
    }

    const decisionMatch = trimmed.match(/^([A-Za-z0-9_]+)\{(.+)\}$/);

    if (decisionMatch) {
        return {
            id: decisionMatch[1],
            label: decisionMatch[2],
            type: 'decision',
        };
    }

    const stepMatch = trimmed.match(/^([A-Za-z0-9_]+)\[(.+)\]$/);

    if (stepMatch) {
        return {
            id: stepMatch[1],
            label: stepMatch[2],
            type: 'step',
        };
    }

    return {
        id: trimmed,
        label: trimmed,
        type: 'step',
    };
}

function parseMermaidFlowchart(source) {
    const lines = source
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

    if (!lines[0]?.startsWith('flowchart')) {
        return null;
    }

    const nodes = {};
    const edges = [];
    const edgeSet = new Set();

    const upsertNode = (node) => {
        if (!node) {
            return;
        }

        if (!nodes[node.id]) {
            nodes[node.id] = node;

            return;
        }

        if (node.label !== node.id) {
            nodes[node.id].label = node.label;
        }

        if (node.type === 'decision') {
            nodes[node.id].type = 'decision';
        }
    };

    lines.slice(1).forEach((line) => {
        if (!line.includes('-->')) {
            return;
        }

        const tokens = line
            .split(/-->/)
            .map((part) => parseNodeToken(part))
            .filter(Boolean);

        tokens.forEach(upsertNode);

        for (let index = 0; index < tokens.length - 1; index += 1) {
            const edgeKey = `${tokens[index].id}->${tokens[index + 1].id}`;

            if (edgeSet.has(edgeKey)) {
                continue;
            }

            edgeSet.add(edgeKey);
            edges.push({ from: tokens[index].id, to: tokens[index + 1].id });
        }
    });

    const nodeIds = Object.keys(nodes);

    if (!nodeIds.length) {
        return null;
    }

    const childrenById = {};
    const incomingCountById = {};

    nodeIds.forEach((nodeId) => {
        childrenById[nodeId] = [];
        incomingCountById[nodeId] = 0;
    });

    edges.forEach(({ from, to }) => {
        childrenById[from].push(to);
        incomingCountById[to] += 1;
    });

    const rootIds = nodeIds.filter((nodeId) => incomingCountById[nodeId] === 0);

    return {
        nodes,
        childrenById,
        rootIds: rootIds.length > 0 ? rootIds : [nodeIds[0]],
    };
}

function getNodeMeta(node) {
    const label = node.label.toLowerCase();

    if (node.type === 'decision') {
        return {
            badge: 'Decision',
            icon: 'alt_route',
            cardClass: 'border-amber-100 bg-amber-50/40 hover:border-amber-300',
            iconClass: 'bg-amber-100/60 text-amber-700',
            badgeClass: 'text-amber-700',
            dotBorderClass: 'border-amber-200 group-hover:border-amber-400',
            dotBgClass: 'bg-amber-500',
        };
    }

    if (label.includes('patient')) {
        return {
            badge: 'Patient Flow',
            icon: 'person',
            cardClass: 'border-rose-100 bg-rose-50/40 hover:border-rose-300',
            iconClass: 'bg-rose-100/60 text-rose-700',
            badgeClass: 'text-rose-700',
            dotBorderClass: 'border-rose-200 group-hover:border-rose-400',
            dotBgClass: 'bg-rose-500',
        };
    }

    if (label.includes('doctor')) {
        return {
            badge: 'Doctor Flow',
            icon: 'stethoscope',
            cardClass: 'border-emerald-100 bg-emerald-50/40 hover:border-emerald-300',
            iconClass: 'bg-emerald-100/60 text-emerald-700',
            badgeClass: 'text-emerald-700',
            dotBorderClass: 'border-emerald-200 group-hover:border-emerald-400',
            dotBgClass: 'bg-emerald-500',
        };
    }

    if (label.includes('admin')) {
        return {
            badge: 'Admin Flow',
            icon: 'admin_panel_settings',
            cardClass: 'border-violet-100 bg-violet-50/40 hover:border-violet-300',
            iconClass: 'bg-violet-100/60 text-violet-700',
            badgeClass: 'text-violet-700',
            dotBorderClass: 'border-violet-200 group-hover:border-violet-400',
            dotBgClass: 'bg-violet-500',
        };
    }

    return {
        badge: 'Step',
        icon: 'task_alt',
        cardClass: 'border-slate-100 bg-white hover:border-slate-300',
        iconClass: 'bg-slate-50 text-slate-600',
        badgeClass: 'text-slate-400',
        dotBorderClass: 'border-slate-200 group-hover:border-slate-400',
        dotBgClass: 'bg-slate-400',
    };
}

function buildFlowSegment(diagram, startId) {
    const segment = [];
    const seen = new Set();
    let currentId = startId;

    while (currentId && !seen.has(currentId)) {
        seen.add(currentId);
        segment.push(currentId);

        const children = diagram.childrenById[currentId] ?? [];

        if (children.length !== 1) {
            return {
                segment,
                branchIds: children,
            };
        }

        currentId = children[0];
    }

    return {
        segment,
        branchIds: [],
    };
}

function FlowBranch({ diagram, startId, path, isSubBranch = false }) {
    const { segment, branchIds } = buildFlowSegment(diagram, startId);
    const branchGridClass = branchIds.length >= 3 ? 'lg:grid-cols-3' : branchIds.length === 2 ? 'md:grid-cols-2' : 'grid-cols-1';

    return (
        <div className="relative pl-6 sm:pl-8">
            {/* Timeline Line */}
            <div className="absolute left-[34px] sm:left-[44px] top-3 bottom-3 w-0.5 bg-slate-100"></div>

            <div className="space-y-6">
                {isSubBranch && (
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mb-2 pl-3">
                        Path Option
                    </div>
                )}

                {segment.map((nodeId, index) => {
                    const node = diagram.nodes[nodeId];
                    const meta = getNodeMeta(node);
                    return (
                        <div key={`${path}-${nodeId}-${index}`} className="relative flex gap-4 sm:gap-6 group">
                            {/* Timeline Dot */}
                            <div className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 bg-white z-10 shrink-0 mt-3 transition duration-300 ${meta.dotBorderClass}`}>
                                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${meta.dotBgClass}`}></div>
                            </div>

                            {/* Step Content Card */}
                            <div className={`flex-1 rounded-2xl border p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-300 max-w-xl ${meta.cardClass}`}>
                                <div className="flex items-start gap-3">
                                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.iconClass}`}>
                                        <span className="material-symbols-outlined text-[18px]">{meta.icon}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-[10px] font-bold uppercase tracking-wider ${meta.badgeClass}`}>{meta.badge}</p>
                                        <p className="mt-0.5 text-sm sm:text-base font-semibold leading-relaxed text-slate-900">{node.label}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {branchIds.length > 0 ? (
                    <div className="relative">
                        {/* Branch Split Point */}
                        <div className="relative flex flex-col gap-2 pl-4 sm:pl-8 py-3">
                            <div className="inline-flex self-start items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-widest bg-slate-50 border border-slate-200/60 px-3 py-1 rounded-full shadow-sm">
                                <span className="material-symbols-outlined text-sm text-slate-400">alt_route</span>
                                Choose Path
                            </div>
                        </div>

                        {/* Section: Branches Grid */}
                        <div className={`grid gap-6 pl-0 sm:pl-8 relative ${branchGridClass}`}>
                            {/* Connecting mobile-only track line for the branch container */}
                            <div className="absolute left-[34px] top-0 bottom-0 w-0.5 bg-slate-100 sm:hidden"></div>

                            {branchIds.map((childId, index) => (
                                <div key={`${path}-${childId}-${index}`} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 relative shadow-sm">
                                    <FlowBranch diagram={diagram} startId={childId} path={`${path}-${childId}`} isSubBranch={true} />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function MermaidDiagram({ source }) {
    const diagram = parseMermaidFlowchart(source);

    if (!diagram) {
        return (
            <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-4 text-slate-100 shadow-sm">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Flow Diagram</p>
                <pre className="overflow-x-auto whitespace-pre-wrap text-sm leading-6 text-slate-100">{source}</pre>
            </div>
        );
    }

    return (
        <div className="rounded-[28px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clinical-gold">Flow Diagram</p>
                    <p className="mt-1 text-sm text-slate-600 font-medium">Illustrated workflow cards based on the guide, so users do not need to read Mermaid syntax.</p>
                </div>
            </div>

            <div className="mt-5 space-y-6">
                {diagram.rootIds.map((rootId, index) => (
                    <FlowBranch key={`${rootId}-${index}`} diagram={diagram} startId={rootId} path={rootId} />
                ))}
            </div>
        </div>
    );
}

function GuideBlocks({ blocks }) {
    return (
        <div className="space-y-5">
            {blocks.map((block, index) => {
                if (block.type === 'heading') {
                    if (block.level === 2) {
                        return (
                            <section key={`${block.content}-${index}`} id={slugify(block.content)} className="scroll-mt-28 pt-2 first:pt-0">
                                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{block.content}</h2>
                            </section>
                        );
                    }

                    return (
                        <h3 key={`${block.content}-${index}`} id={slugify(block.content)} className="scroll-mt-28 pt-1 text-lg font-semibold text-slate-900">
                            {block.content}
                        </h3>
                    );
                }

                if (block.type === 'paragraph') {
                    return (
                        <p key={`${block.content}-${index}`} className="text-sm leading-7 text-slate-600 sm:text-base">
                            <InlineMarkdown text={block.content} />
                        </p>
                    );
                }

                if (block.type === 'list') {
                    const ListTag = block.ordered ? 'ol' : 'ul';

                    return (
                        <ListTag
                            key={`${block.type}-${index}`}
                            className={`space-y-2 pl-5 text-sm leading-7 text-slate-600 sm:text-base ${block.ordered ? 'list-decimal' : 'list-disc'}`}
                        >
                            {block.items.map((item, itemIndex) => (
                                <li key={`${item}-${itemIndex}`}>
                                    <InlineMarkdown text={item} />
                                </li>
                            ))}
                        </ListTag>
                    );
                }

                if (block.type === 'code') {
                    if (block.language === 'mermaid') {
                        return <MermaidDiagram key={`${block.type}-${index}`} source={block.content} />;
                    }

                    return (
                        <div key={`${block.type}-${index}`} className="rounded-[24px] border border-slate-200 bg-slate-950 p-4 text-slate-100 shadow-sm">
                            <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                                {block.language ?? 'Code Block'}
                            </p>
                            <pre className="overflow-x-auto whitespace-pre-wrap text-sm leading-6 text-slate-100">{block.content}</pre>
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
}

function GuideContent({ title, blocks }) {
    const sections = blocks.filter((block) => block.type === 'heading' && block.level === 2);

    return (
        <div className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clinical-gold">User Guide</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                    Read the shared workflow guide for patient, doctor, and admin tasks in one place.
                </p>

                {sections.length > 0 ? (
                    <div className="mt-6 flex flex-wrap gap-2">
                        {sections.map((section) => (
                            <a
                                key={section.content}
                                href={`#${slugify(section.content)}`}
                                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                            >
                                {section.content}
                            </a>
                        ))}
                    </div>
                ) : null}
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <GuideBlocks blocks={blocks} />
            </section>
        </div>
    );
}

export default function UserGuide({ title, blocks, role, doctor }) {
    const content = <GuideContent title={title} blocks={blocks} />;

    return (
        <>
            <Head title="User Guide" />

            {role === 'patient' ? (
                <PatientLayout>{content}</PatientLayout>
            ) : role === 'doctor' ? (
                <DoctorLayout doctor={doctor}>
                    <DoctorPageHeader
                        title="User Guide"
                        subtitle="Keep the patient, doctor, and admin workflows close at hand while you work through your daily tasks."
                    />
                    {content}
                </DoctorLayout>
            ) : (
                <AppLayout
                    title="User Guide"
                    description="Open the shared operating guide for patient, doctor, and admin flows without leaving the application."
                >
                    {content}
                </AppLayout>
            )}
        </>
    );
}
