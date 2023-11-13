import { notifications } from "@mantine/notifications";

export default (title: string, message: string) =>
  notifications.show({
    title,
    message,
    withCloseButton: true,
    color: "red",
    withBorder: true,
  });
