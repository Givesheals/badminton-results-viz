export function ProductionSideMenuScreenshotPreview() {
  return (
    <div
      className="w-full max-w-[375px] overflow-hidden"
      style={{ aspectRatio: '672 / 1024' }}
    >
      <img
        src={`${import.meta.env.BASE_URL}production-side-menu.png`}
        alt="Production side menu (reference screenshot)"
        className="h-full w-full object-cover"
        draggable={false}
      />
    </div>
  )
}

