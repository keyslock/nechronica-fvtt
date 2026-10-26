export const addCircles = function (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context,
  circleMax = 0,
  valueAttribute = "value"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) {
  context.circles = [];
  for (let i = 0; i < circleMax; i++) {
    context.circles.push({
      filled: i + 1 <= foundry.utils.getProperty(context, valueAttribute),
    });
  }

  if (foundry.utils.getProperty(context, "max")) {
    for (let i = 0; i < circleMax; i++) {
      context.circles[i].locked = i + 1 > foundry.utils.getProperty(context, "max");
    }
  }

  if (context.permanent) {
    for (let i = 0; i < context.permanent; i++) {
      context.circles[i].permanent = true;
    }
  }

  return context;
};

