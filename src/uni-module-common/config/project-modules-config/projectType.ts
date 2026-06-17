export interface headerModuleType {
  title?: string;
  icon?: string;
  path?: string;
  [key: string]: any;
}

export interface tabBarItemType {
  pagePath: string;
  text: string;
  iconPath: string;
  selectedIconPath: string;
  dot?: boolean;
}

export interface appConfigType {
  template: {
    basic: {
      tabBar: {
        selectedColor: string;
        color: string;
        list: tabBarItemType[];
      };
      homeTeacherModule?: headerModuleType[];
      homeStudentModule?: headerModuleType[];
      administratorModule?: headerModuleType[];
    };
  };
}
