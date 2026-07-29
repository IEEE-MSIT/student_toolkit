import ToolCard from '../components/cards/ToolCard';

const allTools = [
  {
    title: 'GPA Planner',
    description: 'Search subjects by code or name, auto-fill credits, and track SGPA plus CGPA together.',
    href: '/tools/gpa',
    icon: '📘',
  },
  {
    title: 'Percentage Calc',
    description: 'Convert your CGPA or marks to percentage with custom formulas.',
    href: '/tools/percentage',
    icon: '🔢',
  },
  {
    title: 'Attendance Tracker',
    description: 'Track attendance, simulate skip days, and stay above the 75% target.',
    href: '/tools/attendance',
    icon: '✅',
  },
  {
    title: 'Time Table',
    description: 'Manage and customize your weekly class schedule and rooms.',
    href: '/tools/timetable',
    icon: '📅',
  },
  {
    title: 'PDF Merger',
    description: 'Merge and download study notes or assignments right in your browser.',
    href: '/tools/pdf',
    icon: '📄',
  },
  {
    title: 'Image Compressor',
    description: 'Compress and resize large images before uploading to student portals.',
    href: '/tools/image',
    icon: '🖼️',
  },
  {
    title: 'QR Generator',
    description: 'Generate customizable QR codes for links, texts, or contact details.',
    href: '/tools/qr-gen',
    icon: '🔍',
  },
  {
    title: 'QR Scanner',
    description: 'Scan QR codes directly and view encoded information in real-time.',
    href: '/tools/qr-scan',
    icon: '📷',
  },
  {
    title: 'Unit Converter',
    description: 'Quickly convert between various units of measurement.',
    href: '/tools/converter',
    icon: '⚖️',
  },
];

function ToolsPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-8 shadow-card transition-colors duration-300">
        <h1 className="text-3xl font-serif font-bold text-foreground dark:text-white">All Tools</h1>
        <p className="mt-2 text-sm text-foreground-muted dark:text-slate-400">Choose from the toolkit for academic productivity and utilities.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {allTools.map((tool, index) => (
          <ToolCard
            key={index}
            title={tool.title}
            description={tool.description}
            href={tool.href}
            icon={tool.icon}
          />
        ))}
      </div>
    </section>
  );
}

export default ToolsPage;
