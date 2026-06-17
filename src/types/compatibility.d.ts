declare const wx: any

declare module '@/pages/teacher/correct-homework/correct-homework' {
  const mod: any
  export default mod
}

declare module '@/pages/hooks/usePageParamHooks' {
  const mod: any
  export default mod
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    captureFile?: any
  }
}

declare namespace UniNamespace {
  interface Uni {
    sendNativeEvent?: (...args: any[]) => any
    onNativeEventReceive?: (...args: any[]) => any
  }
}
