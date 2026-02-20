import chalk from "chalk";

export function ok(message: string): string {
  return `${chalk.green("✓")} ${chalk.greenBright(message)}`;
}

export function info(message: string): string {
  return `${chalk.cyan("i")} ${chalk.cyan(message)}`;
}

export function warn(message: string): string {
  return `${chalk.yellow("!")} ${chalk.yellow(message)}`;
}

export function dimPath(value: string): string {
  return chalk.gray(value);
}
