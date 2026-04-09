interface BadgeConfig {
  id: string;
  label: string;
  initialLeft: string; // e.g. '55%'
  initialTop: string; // e.g. '85%'
}

export const badgeConfigs: BadgeConfig[] = [
  { id: "badge-1", label: "이정후", initialLeft: "60%", initialTop: "80%" },
  { id: "badge-2", label: "송성문", initialLeft: "20%", initialTop: "75%" },
  { id: "badge-3", label: "김하성", initialLeft: "20%", initialTop: "85%" },
  { id: "badge-4", label: "박병호", initialLeft: "20%", initialTop: "95%" },
];

export const badgeConfigsForModal: BadgeConfig[] = [
  { id: "badge-1", label: "이정후", initialLeft: "60%", initialTop: "80%" },
  { id: "badge-2", label: "송성문", initialLeft: "20%", initialTop: "75%" },
  { id: "badge-3", label: "김하성", initialLeft: "20%", initialTop: "85%" },
  { id: "badge-4", label: "박병호", initialLeft: "20%", initialTop: "95%" },
];
