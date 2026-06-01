export interface Member {
  name: string;
  matric: string;
}

export const TEAM: Member[] = [
  { name: "Hanif Auliya Hidayat", matric: "24210670" },
  { name: "Muhammad Dzaky Aryasatya", matric: "24086876" },
  { name: "Afdal Zikri Alfalih", matric: "24211243" },
  { name: "Nadiyah Aqilah Putri", matric: "24211204" },
  { name: "Harahap Hilal Mumtaz Saleh", matric: "24200675" },
  { name: "Mahardika Malik", matric: "24205476" },
];

export function initials(name: string) {
  const parts = name.split(" ");
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}
