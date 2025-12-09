(function () {
    const params = new URLSearchParams(window.location.search);
    if (params.has('ci.cherev')) {
        // KEEP the user on the same hosted domain root
        window.location.replace('/?ci=on');
    }
})();
