const Blob = ({ position = "top-left", color = "#CFEBE0", size = 340, blur = true }) => {
    const positions = {
        "top-left": { top: "-8%", left: "-8%" },
        "top-right": { top: "-8%", right: "-8%" },
        "bottom-left": { bottom: "-8%", left: "-8%" },
        "bottom-right": { bottom: "-8%", right: "-8%" },
    };
    return (
        <svg
            style={{
                position: "absolute",
                zIndex: 0,
                width: size,
                height: size,
                filter: blur ? "blur(6px)" : undefined,
                opacity: 0.7,
                pointerEvents: "none",
                ...positions[position],
            }}
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                fill={color}
                d="M47.8,-68.7C60.8,-58.7,69.9,-44.1,70.7,-29.7C71.5,-15.3,64,-1.2,61.7,16.4C59.5,34.1,62.6,54.1,53.5,61.8C44.5,69.4,23.2,64.7,5.7,57.3C-11.8,50,-23.5,39.8,-39.6,32.5C-55.7,25.3,-76.1,21.1,-84.4,8.3C-92.6,-4.6,-88.7,-26.1,-75.5,-39.1C-62.3,-52.1,-39.9,-56.5,-21.6,-64.6C-3.2,-72.8,11,-84.7,24.1,-83.1C37.2,-81.4,49.1,-66.9,47.8,-68.7Z"
                transform="translate(100 100)"
            />
        </svg>
    );
};

export default Blob;
