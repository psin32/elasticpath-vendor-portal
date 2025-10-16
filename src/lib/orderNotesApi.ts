import { createClient } from "./epcc-client";

export async function getOrderNotesByOrderId(orderId: string) {
  try {
    // Note: This function would need proper authentication context
    // For now, this is a placeholder that matches the provided pattern
    const client = createClient("", "", "");
    const response = await client.request.send(
      `/extensions/notes?filter=eq(order_id,${orderId}):eq(private,false)`,
      "GET",
      undefined,
      undefined,
      client,
      false,
      "v2"
    );
    if (response && response.data) {
      return {
        success: true,
        data: response.data,
      };
    }
    return {
      success: false,
      data: [],
      error: "No data received",
    };
  } catch (error) {
    console.error("Error fetching order notes:", error);
    return {
      success: false,
      data: [],
      error: error,
    };
  }
}

export async function createNoteForOrder({
  order_id,
  note,
  added_by,
  isPrivate = false,
}: {
  order_id: string;
  note: string;
  added_by?: string;
  isPrivate?: boolean;
}) {
  // Note: This function would need proper authentication context
  // For now, this is a placeholder that matches the provided pattern
  const client = createClient("", "", "");
  const payload = {
    type: "note_ext",
    order_id,
    note,
    private: isPrivate,
    ...(added_by && { added_by }),
  };
  return await client.request
    .send(
      `/extensions/notes`,
      "POST",
      payload,
      undefined,
      client,
      undefined,
      "v2"
    )
    .catch((err: any) => {
      console.error("Error while creating new order note", err);
      return err;
    });
}
