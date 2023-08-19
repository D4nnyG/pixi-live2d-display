export namespace Cubism4Spec {
    export interface ModelJSON {
        Version: string;
        FileReferences: {
            Moc: string;
            Textures: string[];
            Pose?: string;
            Physics?: string;
            DisplayInfo: string;
            Expressions?: Array<{Name: string; File: string}>;
            Motions?: {
                [name: string]: Array<{File: string, FadeInTime?: number, FadeOutTime?: number;}>;
            };
            UserData?: string;
        };
        Groups?: Array<{Target: string; Group: string; Ids: string[]}>
        HitAreas?: Array<{Name: string; Id: string}>;
        // possibly required for older models?
        url?: string
    }
    export interface Motion {
        Version: string;
        Meta: object;
        Curves: object[];
    }
    export interface Physics{
        Version: number;
        Meta: {
            PhysicsSettingsCount: number;
            TotalInputCount: number;
            TotalOutputCount: number;
            VertexCount: number;
            EffectiveForces: {
                Gravity:{X: number; Y: number};
                Wind:{X: number; Y: number};
            };
            PhysicsDictionary: Array<{
                Id: string;
                Name: string;
            }>
        };
        PhysicsSettings: PhysicsSettingsObject[]
    }
    interface PhysicsSettingsObject{
        Id: string;
        Input: Array<{
            Source:Array<{
                Target: string;
                Id: string
            }>
            Weight: number;
            Type: string;
            Reflect: boolean
        }>;
        Output: Array<{
            Destination: Array<{
                Target: string;
                Id: string;
            }>;
            VertexIndex: number;
            Scale: number;
            Weight: number;
            Type: string;
            Reflect: boolean;
        }>;
        Verticies: Array<{
            Position: {X: number; Y: number};
            Mobility: number;
            Delay: number;
            Acceleration: number;
            Radius: number;
        }>;
        Normalization: {
            Position: {
                Minimum: number;
                Default: number;
                Maximum: number;
            }
            Angle: {
                Minimum: number;
                Default: number;
                Maximum: number;
            }
        }
    }
    export interface Expressions {
        Type: string;
        Parameters: Array<{
            Id: string;
            value: number;
            blend: string;
        }>
    }
    export interface Pose {
        Type: string;
        Groups: Array<Array<{Id: string; link: []}>>
    }
}