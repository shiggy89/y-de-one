import Image from "next/image";
import styles from "./Hero.module.css";

import type { ReactNode } from "react";

type Props = {
	title: ReactNode
	subtitle?: ReactNode
	lead?: ReactNode
	noTitleSpace?: boolean
	alwaysBreak?: boolean
}
export default function Hero({ title, subtitle, lead, noTitleSpace, alwaysBreak }: Props) {
	const titleParts = typeof title === 'string' ? title.split(" ") : null;
	const [titleFirst = "", titleSecond = ""] = titleParts ?? [];

	return (
		<section className={styles.pageHero}>
			<div className={styles.heroInner}>
				<div className={styles.innerPageHero}>
				<Image
					className={styles.dogIcon}
					src="/images/class/dog-icon.png"
					alt="犬のアイコン"
					width={555}
					height={427}
				/>
				<Image
					className={styles.leftTeacherIcon}
					src="/images/class/kazuki-dog-icon.png"
					alt="先生のアイコン"
					width={430}
					height={486}
				/>
				<Image
					className={styles.rightTeacherIcon}
					src="/images/class/yoshiki-idea-red-icon.png"
					alt="先生のアイコン"
					width={500}
					height={500}
				/>
				<h2 className={styles.title}>
					{titleParts ? (
						<>
							<span className={styles.titleTop}>{titleFirst}</span>
							{titleSecond && (
								<>
									{alwaysBreak ? <br /> : <br className={styles.mobileBreak} />}
									<span className={`${styles.titleBottom} ${noTitleSpace ? styles.titleBottomNoSpace : ""}`}>{titleSecond}</span>
								</>
							)}
						</>
					) : title}
					<br />
					{ subtitle }
				</h2>
				{lead && <p className={styles.lead}>{lead}</p>}
				</div>
			</div>
		</section>
	);
}
