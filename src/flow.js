// this object is generated from Flow Builder under "..." > Endpoint > Snippets > Responses
const SCREEN_RESPONSES = {
  APPOINTMENT: {
    screen: "APPOINTMENT",
    data: {
      department: [
        {
          id: "shopping",
          title: "Shopping & Groceries",
        },
        {
          id: "clothing",
          title: "Clothing & Apparel",
        },
        {
          id: "home",
          title: "Home Goods & Decor",
        },
        {
          id: "electronics",
          title: "Electronics & Appliances",
        },
        {
          id: "beauty",
          title: "Beauty & Personal Care",
        },
      ],
      location: [
        {
          id: "1",
          title: "King\u2019s Cross, London",
        },
        {
          id: "2",
          title: "Oxford Street, London",
        },
        {
          id: "3",
          title: "Covent Garden, London",
        },
        {
          id: "4",
          title: "Piccadilly Circus, London",
        },
      ],
      is_location_enabled: true,
      date: [
        {
          id: "2024-01-01",
          title: "Mon Jan 01 2024",
        },
        {
          id: "2024-01-02",
          title: "Tue Jan 02 2024",
        },
        {
          id: "2024-01-03",
          title: "Wed Jan 03 2024",
        },
      ],
      is_date_enabled: true,
      time: [
        {
          id: "10:30",
          title: "10:30",
        },
        {
          id: "11:00",
          title: "11:00",
          enabled: false,
        },
        {
          id: "11:30",
          title: "11:30",
        },
        {
          id: "12:00",
          title: "12:00",
          enabled: false,
        },
        {
          id: "12:30",
          title: "12:30",
        },
      ],
      is_time_enabled: true,
    },
  },
  DETAILS: {
    screen: "DETAILS",
    data: {
      department: "beauty",
      location: "1",
      date: "2024-01-01",
      time: "11:30",
    },
  },
  SUMMARY: {
    screen: "SUMMARY",
    data: {
      appointment:
        "Beauty & Personal Care Department at Kings Cross, London\nMon Jan 01 2024 at 11:30.",
      details:
        "Name: John Doe\nEmail: john@example.com\nPhone: 123456789\n\nA free skin care consultation, please",
      department: "beauty",
      location: "1",
      date: "2024-01-01",
      time: "11:30",
      name: "John Doe",
      email: "john@example.com",
      phone: "123456789",
      more_details: "A free skin care consultation, please",
    },
  },
  TERMS: {
    screen: "TERMS",
    data: {},
  },
  SUCCESS: {
    screen: "SUCCESS",
    data: {
      extension_message_response: {
        params: {
          flow_token: "REPLACE_FLOW_TOKEN",
          some_param_name: "PASS_CUSTOM_VALUE",
        },
      },
    },
  },
};

export const getNextScreen = async (decryptedBody) => {
  console.log("🔥 Received request inside getNextScreen:", decryptedBody);

  const { action, screen, data } = decryptedBody;

  // Handle health check request
  if (action === "ping") {
    return {
      statusCode: 200,
      data: { status: "active" },
    };
  }

  // Handle error notification
  if (data?.error) {
    console.warn("Received client error:", data);
    return {
      statusCode: 200,
      data: { acknowledged: true },
    };
  }

  // Handle initial request when opening the flow
  if (action === "init") {
    console.log("✅ Handling 'init' action");

    return {
      statusCode: 200,
      screen: "APPOINTMENT",
      data: {
        ...SCREEN_RESPONSES.APPOINTMENT.data,
        is_location_enabled: false,
        is_date_enabled: false,
        is_time_enabled: false,
      },
      version: "3.0",
      action: "init",
    };
  }

  if (action === "data_exchange") {
    switch (screen) {
      case "APPOINTMENT":
        return {
          statusCode: 200,
          ...SCREEN_RESPONSES.APPOINTMENT,
          data: {
            ...SCREEN_RESPONSES.APPOINTMENT.data,
            is_location_enabled: Boolean(data?.department),
            is_date_enabled: Boolean(data?.department) && Boolean(data?.location),
            is_time_enabled: Boolean(data?.department) && Boolean(data?.location) && Boolean(data?.date),
            location: SCREEN_RESPONSES.APPOINTMENT.data.location.slice(0, 3),
            date: SCREEN_RESPONSES.APPOINTMENT.data.date.slice(0, 3),
            time: SCREEN_RESPONSES.APPOINTMENT.data.time.slice(0, 3),
          },
        };

      case "DETAILS":
        if (!data?.department || !data?.location || !data?.date || !data?.time) {
          console.warn("❌ Missing required details:", data);
          return {
            statusCode: 400,
            data: { error: "Missing required details in request." },
          };
        }

        const departmentName = SCREEN_RESPONSES.APPOINTMENT.data.department.find(
          (dept) => dept.id === data.department
        )?.title;

        const locationName = SCREEN_RESPONSES.APPOINTMENT.data.location.find(
          (loc) => loc.id === data.location
        )?.title;

        const dateName = SCREEN_RESPONSES.APPOINTMENT.data.date.find(
          (date) => date.id === data.date
        )?.title;

        if (!departmentName || !locationName || !dateName) {
          console.error("❌ Invalid selection IDs in request:", data);
          return {
            statusCode: 400,
            data: { error: "Invalid department, location, or date selection." },
          };
        }

        return {
          statusCode: 200,
          ...SCREEN_RESPONSES.SUMMARY,
          data: {
            appointment: `${departmentName} at ${locationName}\n${dateName} at ${data.time}`,
            details: `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\n"${data.more_details}"`,
            ...data,
          },
        };

      case "SUMMARY":
        return {
          statusCode: 200,
          ...SCREEN_RESPONSES.SUCCESS,
          data: {
            extension_message_response: {
              params: {
                flow_token: decryptedBody.flow_token,
              },
            },
          },
        };

      default:
        console.error("❌ Unknown screen:", screen);
        return {
          statusCode: 400,
          data: { error: "Invalid screen in request." },
        };
    }
  }

  console.error("❌ Unhandled request body:", decryptedBody);
  return {
    statusCode: 400,
    data: { error: "Unhandled endpoint request. Make sure you handle the request action & screen." },
  };
};
