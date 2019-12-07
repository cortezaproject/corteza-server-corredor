export interface IPackageJSON {
    readonly dependencies?: IDependencyMap;
}

export interface IDependencyMap {
    [dependencyName: string]: string;
}

export interface IPackageInstallStatus {
    name: string
    version: string
    installed: boolean
}

export interface IWatchCallback {
    (): void
}


