export interface PackageJSON {
    readonly dependencies?: DependencyMap;
}

export interface DependencyMap {
    [dependencyName: string]: string;
}

export interface PackageInstallStatus {
    name: string;
    version: string;
    installed: boolean;
}

export interface WatchCallback {
    (): void;
}
