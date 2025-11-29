export type Props = {
  userName: string
}

export type WorkspaceLite = { id: string; name: string }

export type BaseLite = {
  id: string
  name: string
  workspaceId: string
  workspaceName: string
  starred: boolean
  lastModifiedAt: Date
}

export type NavKey = "home" | "starred" | "workspaces"
